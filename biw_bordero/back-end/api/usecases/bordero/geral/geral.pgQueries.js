// export const pgQueries = {
//   base: `
//     FROM public.mv_loss_history
//     WHERE losstime > 0
//   `,
// };

export const pgQueries = {
  base: `
    FROM public.line_status_history_view
    WHERE losstime > 0 and priority = 1
  `,
};
