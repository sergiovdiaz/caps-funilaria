// utils/scheduler.js
export function scheduleDaily(hour, minute, callback) {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

  // Se o horário já passou, agenda para o próximo dia
  if (now > target) target.setDate(target.getDate() + 1);

  const millis = target - now;

  setTimeout(() => {
    callback(); // executa pela primeira vez
    setInterval(callback, 24 * 60 * 60 * 1000); // repete todo dia
  }, millis);
}



export function scheduleEvery(intervalMs, callback, options = {}) {
  const { runOnStart = false } = options;

  if (runOnStart) {
    callback();
  }

  const now = Date.now();
  const delay = intervalMs - (now % intervalMs);

  setTimeout(() => {
    callback();

    setInterval(() => {
      callback();
    }, intervalMs);
  }, delay);
}
