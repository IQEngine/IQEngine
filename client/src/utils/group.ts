export function groupContingousIndexes(indexes: number[]) {
  const contigousIndexes: { start: number; count: number }[] = [];
  if (indexes.length === 0) {
    return contigousIndexes;
  }
  indexes.sort((a, b) => a - b);
  for (let i = 0; i < indexes.length; i++) {
    const index = indexes[i];
    if (i === 0) {
      contigousIndexes.push({ start: index, count: 1 });
    } else {
      const lastContigousIndex = contigousIndexes[contigousIndexes.length - 1];
      if (lastContigousIndex.start + lastContigousIndex.count === index) {
        lastContigousIndex.count++;
      } else {
        contigousIndexes.push({ start: index, count: 1 });
      }
    }
  }

  return contigousIndexes;
}
