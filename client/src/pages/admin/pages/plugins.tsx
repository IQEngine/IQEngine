import { PluginDefinition } from '@/api/Models';
import {
  useGetPlugins,
  useGetPluginDetailed,
  useCreatePlugin,
  useDeletePlugin,
  useUpdatePlugin,
} from '@/api/plugin/queries';
import { ArrowTopRightOnSquareIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';

interface PluginRowProps {
  plugin: PluginDefinition;
  removePlugin: (plugin: PluginDefinition) => void;
}

import cn from 'classnames';
import { useOnClickOutside } from 'usehooks-ts';
import toast from 'react-hot-toast';
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

export const PluginDetail = ({ plugin }: PluginRowProps) => {
  const [openDetails, setOpenDetails] = useState(false);
  const { data } = useGetPluginDetailed(plugin, openDetails);
  const handleToggleDetails = () => {
    setOpenDetails((prev) => !prev);
  };
  return (
    <>
      <button aria-label={`plugin ${plugin.name} detail`} onClick={handleToggleDetails}>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </button>
      <Modal open={openDetails} onClose={handleToggleDetails} disableClickOutside={!openDetails}>
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
          <button className="h-9" onClick={handleToggleDetails}>
            Close
          </button>
        </div>
      </Modal>
    </>
  );
};

export const PluginEdit = ({ plugin }: PluginRowProps) => {
  const updatePlugin = useUpdatePlugin();
  const [openEdit, setOpenEdit] = useState(false);
  const handleToggleEdit = () => {
    setOpenEdit((prev) => !prev);
  };
  function handleUpdate(event: React.SyntheticEvent) {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      name: { value: string };
      url: { value: string };
    };
    const name = target.name.value;
    const url = target.url.value;
    updatePlugin.mutate(
      { name, url },
      {
        onSuccess: () => {
          toast('Successfully updated plugin', {
            icon: '👍',
            className: 'bg-green-100 font-bold',
          });
        },
        onError: (response) => {
          toast('Something went wrong updating the plugin', {
            icon: '😖',
            className: 'bg-red-100 font-bold',
          });
        },
      }
    );
    setOpenEdit((prev) => !prev);
  }

  return (
    <>
      <button aria-label={`plugin ${plugin.name} edit`} onClick={handleToggleEdit}>
        <PencilIcon className="h-4 w-4" />
      </button>
      <Modal open={openEdit} onClose={handleToggleEdit} disableClickOutside={!openEdit}>
        <form onSubmit={handleUpdate}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="input input-bordered"
              defaultValue={plugin.name}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">URL</span>
            </label>
            <input
              type="text"
              name="url"
              placeholder="URL"
              className="input input-bordered"
              defaultValue={plugin.url}
            />
          </div>
          <div className="modal-action">
            <button
              className="h-9"
              onClick={(e) => {
                e.preventDefault();
                setOpenEdit(false);
              }}
            >
              Cancel
            </button>
            <button className="h-9" type="submit">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export const PluginDelete = ({ plugin, removePlugin }: PluginRowProps) => {
  return (
    <button aria-label={`delete ${plugin.name} plugin`} onClick={() => removePlugin(plugin)}>
      <TrashIcon className="h-4 w-4" />
    </button>
  );
};

export const PluginAdd = () => {
  const createPlugin = useCreatePlugin();
  const [open, setOpen] = useState(false);
  const handleToggle = () => setOpen((prev) => !prev);
  function handleSave(event: React.SyntheticEvent) {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    createPlugin.mutate(
      { name, url },
      {
        onSuccess: () => {
          toast('Successfully added plugin', {
            icon: '👍',
            className: 'bg-green-100 font-bold',
          });
        },
        onError: (response) => {
          toast('Something went wrong addin a plugin', {
            icon: '😖',
            className: 'bg-red-100 font-bold',
          });
        },
      }
    );
  }
  return (
    <>
      <button className="h-9" name="Add Plugin" aria-label="add plugin" onClick={handleToggle}>
        Add Plugin
      </button>
      <Modal open={open} onClose={handleToggle} disableClickOutside={!open}>
        <form onSubmit={handleSave}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              aria-label="plugin name"
              name="name"
              placeholder="Name"
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">URL</span>
            </label>
            <input type="text" aria-label="plugin url" name="url" placeholder="URL" className="input input-bordered" />
          </div>
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              Close
            </button>
            <button className="btn btn-primary" type="submit" aria-label="save plugin">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export const PluginRow = ({ plugin, removePlugin }: PluginRowProps) => {
  return (
    <tr>
      <td>{plugin.name}</td>
      <td>{plugin.url}</td>
      <td>
        <PluginDetail plugin={plugin} removePlugin={removePlugin} />
        <PluginEdit plugin={plugin} removePlugin={removePlugin} />
        <PluginDelete plugin={plugin} removePlugin={removePlugin} />
      </td>
    </tr>
  );
};

export const Plugins = () => {
  const { data } = useGetPlugins();
  const deletePlugin = useDeletePlugin();
  function removePlugin(plugin: PluginDefinition) {
    if (confirm(`Are you sure you want to delete ${plugin.name}?`)) {
      deletePlugin.mutate(
        { name: plugin.name, url: plugin.url },
        {
          onSuccess: () => {
            toast('Successfully deleted plugin', {
              icon: '👍',
              className: 'bg-green-100 font-bold',
            });
          },
          onError: (response) => {
            toast('Something went wrong deleting the plugin', {
              icon: '😖',
              className: 'bg-red-100 font-bold',
            });
          },
        }
      );
    }
  }
  return (
    <>
      <h1 className="text-3xl font-bold">Plugins</h1>
      <PluginAdd />
      {data && data?.length > 0 ? (
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
              <PluginRow key={i} plugin={item} removePlugin={removePlugin} />
            ))}
          </tbody>
        </table>
      ) : (
        <div className="alert alert-info">No plugins found</div>
      )}
    </>
  );
};

export default Plugins;
