export function toCursorPair(doc) {
  return { id: String(doc._id), created_at: doc.created_at || doc.createdAt };
}
export function cursorQuery(cursor) {
  if (!cursor) return {};
  const c = typeof cursor === 'string' ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : cursor;
  return { $or: [
    { created_at: { $lt: new Date(c.created_at) } },
    { created_at: new Date(c.created_at), _id: { $lt: c.id } }
  ]};
}
export function encodeCursor(doc) {
  if (!doc) return null;
  const payload = JSON.stringify({ id: String(doc._id), created_at: (doc.created_at || doc.createdAt || new Date()).toISOString() });
  return Buffer.from(payload).toString('base64');
}
