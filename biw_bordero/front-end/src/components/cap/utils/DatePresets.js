export class DatePresets {
  static today() {
    const today = new Date();

    const start = new Date(today);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  static yesterday() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  static currentWeek() {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(today);
    start.setDate(today.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  static lastWeek() {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(today);
    start.setDate(today.getDate() + diffToMonday - 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  static currentMonth() {
    const today = new Date();

    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  static lastMonth() {
    const today = new Date();

    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }
}
