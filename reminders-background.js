importScripts('reminders-data.js', 'hydration-core.js');

const reminders = globalThis.GLASSHOME_REMINDERS;
const alarmPrefix = 'glassboard-reminder-';
const notificationStateKey = 'glassboardReminderNotificationState';
const hydrationAlarmName = 'glassboard-hydration-reminder';
const hydrationNotificationId = 'glassboard-hydration';
const hydrationDataKey = 'hydrationData';
const hydration = globalThis.GLASS_HOME_HYDRATION;
let notificationQueue = Promise.resolve();

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextOccurrence(reminder, now) {
  const [hour, minute] = reminder.time.split(':').map(Number);
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

function getCurrentReminder(now) {
  const minute = Math.floor(now.getMinutes() / 15) * 15;
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return reminders.find(reminder => reminder.time === time);
}

function enqueueNotification(reminder, now) {
  const date = getDateKey(now);
  notificationQueue = notificationQueue.then(async () => {
    if (!await chrome.permissions.contains({permissions: ['notifications']})) return;
    const data = await chrome.storage.local.get(notificationStateKey);
    const previousState = data[notificationStateKey];
    const times = previousState?.date === date && Array.isArray(previousState.times)
      ? previousState.times
      : [];
    if (times.includes(reminder.time)) return;

    await chrome.storage.local.set({
      [notificationStateKey]: {date, times: [...times, reminder.time]}
    });

    const notificationId = `glassboard-reminder-${date}-${reminder.time.replace(':', '-')}`;
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icon128.png'),
      title: 'GlassHome · Nhắc nhở',
      message: `${reminder.time} · ${reminder.text}`,
      contextMessage: 'Tiến trình một ngày',
      priority: 0,
      requireInteraction: false
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Không thể gửi thông báo nhắc nhở:', chrome.runtime.lastError.message);
      }
    });
  }).catch(error => {
    console.error('Không thể xử lý thông báo nhắc nhở:', error);
  });
  return notificationQueue;
}

async function scheduleReminder(reminder, now = new Date()) {
  await chrome.alarms.create(alarmPrefix + reminder.time, {
    when: nextOccurrence(reminder, now)
  });
}

async function clearReminderAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(alarms
    .filter(alarm => alarm.name.startsWith(alarmPrefix))
    .map(alarm => chrome.alarms.clear(alarm.name)));
}

async function scheduleAllReminders() {
  await clearReminderAlarms();
  const now = new Date();
  const currentReminder = getCurrentReminder(now);
  if (currentReminder) await enqueueNotification(currentReminder, now);
  await Promise.all(reminders.map(reminder => scheduleReminder(reminder, now)));
}

async function scheduleHydrationReminder() {
  const stored = await chrome.storage.local.get(hydrationDataKey);
  const data = stored[hydrationDataKey];
  const hasPermission = await chrome.permissions.contains({permissions: ['notifications']});
  if (!data?.settings?.remindersEnabled || !data.settings.backgroundNotifications
    || !hasPermission) {
    await chrome.alarms.clear(hydrationAlarmName);
    if (hasPermission) await chrome.notifications.clear(hydrationNotificationId);
    return;
  }

  const nextReminderAt = hydration.getNextReminderAt(data);
  if (!nextReminderAt) {
    await chrome.alarms.clear(hydrationAlarmName);
    return;
  }
  if (Number(data.nextReminderAt) !== nextReminderAt) {
    data.nextReminderAt = nextReminderAt;
    await chrome.storage.local.set({[hydrationDataKey]: data});
  }
  await chrome.alarms.clear(hydrationAlarmName);
  chrome.alarms.create(hydrationAlarmName, {when: nextReminderAt});
}

async function handleHydrationAlarm() {
  const stored = await chrome.storage.local.get(hydrationDataKey);
  const data = stored[hydrationDataKey];
  if (!data?.settings?.remindersEnabled || !data.settings.backgroundNotifications
    || !await chrome.permissions.contains({permissions: ['notifications']})) {
    await scheduleHydrationReminder();
    return;
  }

  const dueAt = Number(data.nextReminderAt);
  const now = Date.now();
  if (!Number.isFinite(dueAt) || dueAt <= 0 || dueAt > now) {
    await scheduleHydrationReminder();
    return;
  }

  const settings = data.settings;
  const currentAllowed = hydration.getNextAllowedTime(now, settings.startTime, settings.endTime) === now;
  const intervalMs = hydration.getIntervalMinutes(settings) * 60 * 1000;
  const nextCandidate = (currentAllowed ? now : dueAt) + intervalMs;
  data.nextReminderAt = hydration.getNextAllowedTime(nextCandidate, settings.startTime, settings.endTime);
  data.snoozedUntil = null;
  if (Number(data.lastReminderAt) !== dueAt && currentAllowed) {
    data.lastReminderAt = dueAt;
  }
  await chrome.storage.local.set({[hydrationDataKey]: data});

  if (Number(data.lastReminderAt) !== dueAt || !currentAllowed) return;
  const allowed = await chrome.permissions.contains({permissions: ['notifications']});
  if (!allowed) return;
  chrome.notifications.create(hydrationNotificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icon128.png'),
    title: 'Hydration check!',
    message: 'Một ngụm nước, thêm chút năng lượng. Đứng dậy uống nước nào!',
    contextMessage: 'GlassHome · Nhắc uống nước',
    priority: 1,
    requireInteraction: false,
    buttons: [
      {title: 'Snooze 10 phút'},
      {title: 'Đã uống 200 ml'}
    ]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Không thể gửi thông báo uống nước:', chrome.runtime.lastError.message);
    }
  });
}

async function handleHydrationNotificationAction(buttonIndex) {
  const stored = await chrome.storage.local.get(hydrationDataKey);
  const data = stored[hydrationDataKey];
  if (!data?.settings?.remindersEnabled) return;

  const now = Date.now();
  if (buttonIndex === 0) {
    data.snoozedUntil = now + 10 * 60 * 1000;
    data.nextReminderAt = hydration.getNextAllowedTime(
      data.snoozedUntil,
      data.settings.startTime,
      data.settings.endTime
    );
  } else if (buttonIndex === 1) {
    const dateKey = hydration.getDateKey(new Date(now));
    const history = data.historyByDate || (data.historyByDate = {});
    const entries = history[dateKey] || (history[dateKey] = []);
    entries.push({id: `${now}-${Math.random().toString(36).slice(2, 8)}`, amount: 200, timestamp: now});
    data.snoozedUntil = null;
    data.nextReminderAt = hydration.getNextAllowedTime(
      now + hydration.getIntervalMinutes(data.settings) * 60 * 1000,
      data.settings.startTime,
      data.settings.endTime
    );
  } else {
    return;
  }

  await chrome.notifications.clear(hydrationNotificationId);
  await chrome.storage.local.set({[hydrationDataKey]: data});
}

chrome.runtime.onInstalled.addListener(() => {
  void scheduleAllReminders().catch(error => {
    console.error('Không thể lên lịch nhắc nhở:', error);
  });
  void scheduleHydrationReminder().catch(error => {
    console.error('Không thể lên lịch nhắc uống nước:', error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  void scheduleAllReminders().catch(error => {
    console.error('Không thể lên lịch nhắc nhở:', error);
  });
  void scheduleHydrationReminder().catch(error => {
    console.error('Không thể lên lịch nhắc uống nước:', error);
  });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === hydrationAlarmName) {
    void handleHydrationAlarm().catch(error => {
      console.error('Không thể xử lý nhắc uống nước:', error);
    });
    return;
  }
  if (!alarm.name.startsWith(alarmPrefix)) return;
  const time = alarm.name.slice(alarmPrefix.length);
  const reminder = reminders.find(item => item.time === time);
  if (!reminder) {
    console.error('Không tìm thấy nội dung cho lịch nhắc:', alarm.name);
    return;
  }
  const now = new Date();
  const alarmDate = new Date(alarm.scheduledTime);
  if (getDateKey(alarmDate) === getDateKey(now)
    && getCurrentReminder(now)?.time === reminder.time) {
    void enqueueNotification(reminder, now);
  }
  void scheduleReminder(reminder).catch(error => {
    console.error('Không thể đặt lịch nhắc tiếp theo:', error);
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[hydrationDataKey]) {
    void scheduleHydrationReminder().catch(error => {
      console.error('Không thể cập nhật lịch nhắc uống nước:', error);
    });
  }
});

function handleHydrationNotificationClick(notificationId, buttonIndex) {
  if (notificationId !== hydrationNotificationId) return;
  void handleHydrationNotificationAction(buttonIndex).catch(error => {
    console.error('Không thể xử lý thao tác nhắc uống nước:', error);
  });
}

function registerHydrationNotificationClickListener() {
  const clickEvent = chrome.notifications?.onButtonClicked;
  if (!clickEvent || clickEvent.hasListener?.(handleHydrationNotificationClick)) return;
  clickEvent.addListener(handleHydrationNotificationClick);
}

registerHydrationNotificationClickListener();
chrome.permissions.onAdded.addListener(({permissions}) => {
  if (!permissions.includes('notifications')) return;
  registerHydrationNotificationClickListener();
  void scheduleAllReminders().catch(error => {
    console.error('Không thể đặt lại lịch nhắc sau khi cấp quyền:', error);
  });
  void scheduleHydrationReminder().catch(error => {
    console.error('Không thể cập nhật lịch nhắc uống nước sau khi cấp quyền:', error);
  });
});
chrome.permissions.onRemoved.addListener(({permissions}) => {
  if (!permissions.includes('notifications')) return;
  const clickEvent = chrome.notifications?.onButtonClicked;
  if (clickEvent?.hasListener?.(handleHydrationNotificationClick)) {
    clickEvent.removeListener(handleHydrationNotificationClick);
  }
});
