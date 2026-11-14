globalThis.GLASS_HOME_HYDRATION = (() => {
  const defaults = {
    settings: {
      remindersEnabled: true,
      intervalMinutes: 60,
      customIntervalMinutes: 60,
      startTime: '07:00',
      endTime: '22:30',
      dailyGoalMl: 2000,
      backgroundNotifications: false
    },
    historyByDate: {},
    nextReminderAt: null,
    lastReminderAt: null,
    lastHomeReminderAt: null,
    snoozedUntil: null
  };

  function getDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function getIntervalMinutes(settings) {
    const raw = settings.intervalMinutes === 'custom'
      ? settings.customIntervalMinutes
      : settings.intervalMinutes;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(480, Math.max(5, Math.round(value))) : 60;
  }

  function parseTime(value) {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hour, minute] = value.split(':').map(Number);
    return hour < 24 && minute < 60 ? {hour, minute, total: hour * 60 + minute} : null;
  }

  function getNextAllowedTime(timestamp, startTime, endTime) {
    const startParts = parseTime(startTime);
    const endParts = parseTime(endTime);
    if (!startParts || !endParts || startParts.total === endParts.total) return null;

    const candidate = new Date(timestamp);
    for (let offset = -1; offset <= 3; offset++) {
      const start = new Date(
        candidate.getFullYear(),
        candidate.getMonth(),
        candidate.getDate() + offset,
        startParts.hour,
        startParts.minute
      );
      const end = new Date(start);
      if (startParts.total < endParts.total) {
        end.setHours(endParts.hour, endParts.minute, 0, 0);
      } else {
        end.setDate(end.getDate() + 1);
        end.setHours(endParts.hour, endParts.minute, 0, 0);
      }

      if (timestamp >= start.getTime() && timestamp <= end.getTime()) return timestamp;
      if (start.getTime() > timestamp) return start.getTime();
    }
    return null;
  }

  function getNextReminderAt(data, now = Date.now()) {
    const settings = data.settings || defaults.settings;
    if (!settings.remindersEnabled) return null;

    const intervalMs = getIntervalMinutes(settings) * 60 * 1000;
    const snoozedUntil = Number(data.snoozedUntil);
    const currentTarget = Number(data.nextReminderAt);
    const lastReminderAt = Number(data.lastReminderAt);
    const candidate = Number.isFinite(snoozedUntil) && snoozedUntil > now
      ? snoozedUntil
      : Number.isFinite(currentTarget) && currentTarget > now
        ? currentTarget
        : Number.isFinite(lastReminderAt) && lastReminderAt > 0 && lastReminderAt + intervalMs > now
          ? lastReminderAt + intervalMs
          : now + intervalMs;

    return getNextAllowedTime(candidate, settings.startTime, settings.endTime);
  }

  return {defaults, getDateKey, getIntervalMinutes, getNextAllowedTime, getNextReminderAt};
})();
