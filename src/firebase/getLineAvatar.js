export const getLineAvatar = lineId => {
  return lineId
    ? `https://firebasestorage.googleapis.com/v0/b/qualle-web.appspot.com/o/assets%2Fssl%2F${lineId}.png?alt=media&token=6ead2730-d1d2-45a6-b8ff-ce4c83aa0277`
    : null
}
