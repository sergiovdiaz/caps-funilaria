// src/utils/bulkInsertBuilder.js

export function buildBulkInsert({ table, columns, rows }) {
  if (!rows || !rows.length) {
    return null;
  }

  const values = [];
  const placeholders = [];

  const columnCount = columns.length;

  rows.forEach((row, rowIndex) => {
    const baseIndex = rowIndex * columnCount;

    const rowPlaceholders = columns.map((_, colIndex) => {
      return `$${baseIndex + colIndex + 1}`;
    });

    placeholders.push(`(${rowPlaceholders.join(", ")})`);
    values.push(...row);
  });

  const query = `
    INSERT INTO ${table}
    (${columns.join(", ")})
    VALUES ${placeholders.join(", ")}
  `;

  return { query, values };
}



export function chunkArray(array, size) {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}
