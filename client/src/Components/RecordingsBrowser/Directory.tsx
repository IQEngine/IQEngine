// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import FileRow from './File';
import styled from 'styled-components';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpen from '@mui/icons-material/FolderOpen';
import { DirectoryNode } from './DirectoryNode';
import React, { useState } from 'react';

const StyledOpenFolderIcon = styled(FolderOpen)`
  color: orange;
  vertical-align: bottom;
  font-size: 20px !important;
  margin-right: 4px;
`;

const StyledFolderIcon = styled(FolderIcon)`
  color: orange;
  vertical-align: bottom;
  font-size: 20px !important;
  margin-right: 4px;
`;

interface DirectoryProps {
  directory: DirectoryNode;
  setExpanded: (name: string) => void;
  isExpanded: boolean;
}

function Directory({ directory, setExpanded, isExpanded }: DirectoryProps) {
  const [childExpanded, setChildExpanded] = useState('');
  const handleLocalToggle = () => {
    if (isExpanded) {
      setExpanded('');
      setChildExpanded('');
    }
    setExpanded(directory.name);
  };
  return (
    <>
      <tr onClick={handleLocalToggle} className="hover:bg-info/40 hover:cursor-pointer focus:outline-none h-12">
        <td className="text-l" colSpan={8}>
          {isExpanded ? <StyledOpenFolderIcon /> : <StyledFolderIcon />}
          {directory.name}
        </td>
      </tr>
      {isExpanded && (
        <>
          {directory.children.map(
            (child) =>
              (childExpanded == '' || childExpanded == child?.name) && (
                <Directory
                  key={child?.name}
                  directory={child}
                  isExpanded={child?.name == childExpanded}
                  setExpanded={setChildExpanded}
                />
              )
          )}
          {!childExpanded && directory.files.map((file) => <FileRow key={file.getFileName()} item={file} />)}
        </>
      )}
    </>
  );
}

export default Directory;
