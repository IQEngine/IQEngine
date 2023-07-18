import { PluginDefinition } from '@/api/Models';
import { useGetPlugins, useGetPluginDetailed } from '@/api/plugin/queries';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';

interface PluginRowProps {
  plugin: PluginDefinition;
}

import cn from 'classnames';
import { useOnClickOutside } from 'usehooks-ts';
type Props = {
  children: React.ReactNode;
  open: boolean;
  // add disableClickOutside
  disableClickOutside?: boolean;
  //add onClose event so that we can close the modal from inside the component
  onClose(): void;
};

const Modal = ({ children, open, disableClickOutside, onClose }: Props) => {
  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    if (!disableClickOutside) {
      onClose();
    }
  });

  const modalClass = cn({
    'modal modal-bottom sm:modal-middle': true,
    'modal-open': open,
  });
  return (
    <div className={modalClass}>
      <div className="modal-box" ref={ref}>
        {children}
      </div>
    </div>
  );
};

export const PluginRow = ({ plugin }: PluginRowProps) => {
  const { data } = useGetPluginDetailed(plugin);
  const [open, setOpen] = useState(false);
  const handleToggle = () => setOpen((prev) => !prev);
  return (
    <tr>
      <td>{plugin.name}</td>
      <td>{plugin.url}</td>
      <td>
        <button aria-label={`Plugin ${plugin.name} Modal Open Button`} onClick={handleToggle}>
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </button>
        <Modal open={open} onClose={handleToggle} disableClickOutside={!open}>
          <p>
            <span className="font-bold">Name:</span> {plugin.name}
          </p>
          <p>
            <span className="font-bold">URL:</span> {plugin.url}
          </p>
          {data && (
            <>
              {Object.keys(data.plugins).map((key, i) => (
                <div className="collapse collapse-arrow join-item border border-primary">
                  <input type="radio" name={key} />
                  <div className="collapse-title font-medium">{key}</div>
                  <div className="collapse-content">
                    {/* List all parameters of the plugin */}
                    <ul>
                      {Object.keys(data.plugins[key]).map((parameter, j) => (
                        <li key={j}>
                          <span className="">{data.plugins[key][parameter].title}</span>:{' '}
                          {data.plugins[key][parameter].type}
                          <br />
                          Default: {data.plugins[key][parameter].default}
                          <hr className="border-secondary" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </>
          )}
          <hr className="border-secondary" />
          <div className="modal-action">
            <button className="btn" onClick={handleToggle}>
              Close
            </button>
          </div>
        </Modal>
      </td>
    </tr>
  );
};

export const Plugins = () => {
  const { data } = useGetPlugins();
  return (
    <>
      <h1 className="text-3xl font-bold">Plugins</h1>
      <table className="table w-full">
        <thead>
          <tr>
            <th className="text-left">Name</th>
            <th className="text-left">URL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, i) => (
            <PluginRow key={i} plugin={item} />
          ))}
        </tbody>
      </table>
    </>
  );
};

export default Plugins;
