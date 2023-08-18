import { SigMFMetadata } from '@/utils/sigmfMetadata';

export interface DirectoryNode {
  name: string;
  children: DirectoryNode[];
  files: string[];
}

export function groupDataByDirectories(data: string[], rootPath = '/'): DirectoryNode {
  const root: DirectoryNode = {
    name: rootPath,
    children: [],
    files: [],
  };

  for (const item of data) {
    const filePath = item;
    const directories = getDirectoriesFromPath(filePath);
    let currentNode = root;

    for (const directory of directories) {
      let childNode = currentNode.children.find((node) => node.name === directory);

      if (!childNode) {
        childNode = {
          name: directory,
          children: [],
          files: [],
        };
        currentNode.children.push(childNode);
      }

      currentNode = childNode;
    }

    currentNode.files.push(item);
  }
  return root;
}

function getDirectoriesFromPath(filePath: string): string[] {
  const directoryPath = filePath.substring(0, filePath.lastIndexOf('/')); // Assuming Unix-style paths
  const directories = directoryPath.split('/');
  return directories.filter((directory) => directory !== '');
}
