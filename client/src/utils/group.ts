export function groupContingousIndexes(indexes: number[]) {
  const contigousIndexes: { start: number; count: number }[] = [];
  for (let i = indexes[0]; i < indexes.length - 1; i++) {
    if (indexes[i] + 1 === indexes[i + 1]) {
      if (contigousIndexes.length === 0) {
        contigousIndexes.push({ start: i, count: 2 });
      } else {
        contigousIndexes[contigousIndexes.length - 1].count++;
      }
    } else {
      contigousIndexes.push({ start: i + 1, count: 1 });
    }
  }
  return contigousIndexes;
}
