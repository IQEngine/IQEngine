import { PluginDefinition } from '@/api/Models';
import { ModalDialog } from '@/features/ui/modal/Modal';

import {
  useGetPlugins,
  useGetPluginDetailed,
  useCreatePlugin,
  useDeletePlugin,
  useUpdatePlugin,
} from '@/api/plugin/queries';
import { ArrowTopRightOnSquareIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useRef } from 'react';

interface PluginRowProps {
  plugin: PluginDefinition;
  removePlugin?: (plugin: PluginDefinition) => void;
}

import toast from 'react-hot-toast';

export const PluginDetail = ({ plugin }: PluginRowProps) => {
  const [showModal, setShowModal] = useState(false);
  const { data } = useGetPluginDetailed(plugin, showModal);

  return (
    <>
      <button aria-label={`plugin ${plugin.name} detail`} onClick={() => {
              setShowModal(true);
            }}>
        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      </button>

      {showModal && <ModalDialog heading={`Plugin detail`} setShowModal={setShowModal}>
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
        </ModalDialog>}
    </>
  );
};

export const PluginEdit = ({ plugin }: PluginRowProps) => {
  const [showModal, setShowModal] = useState(false);
  const updatePlugin = useUpdatePlugin();
  function handleUpdate(event: React.SyntheticEvent) {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const url = formData.get('url') as string;
    updatePlugin.mutate(
      { name: plugin.name, url },
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
    setShowModal(!showModal);
  }

  return (
    <>
        <form onSubmit={handleUpdate}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <span>{plugin.name}</span>
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
              aria-label={`edit ${plugin.name} plugin url`}
              defaultValue={plugin.url}
            />
          </div>
          <div className="modal-action">
            <button
              className="h-9"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Cancel
            </button>
            <button className="h-9" aria-label={`save ${plugin.name} plugin`}>
              Save
            </button>
          </div>
        </form>
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
          toast('Something went wrong adding a plugin', {
            icon: '😖',
            className: 'bg-red-100 font-bold',
          });
        },
      }
    );
  }
  return (
    <>
        <form onSubmit={handleSave}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              aria-label="add plugin name"
              name="name"
              placeholder="Name"
              className="input input-bordered"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">URL</span>
            </label>
            <input
              type="text"
              aria-label="add plugin url"
              name="url"
              placeholder="URL"
              className="input input-bordered"
            />
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" type="submit" aria-label="create plugin">
              Save
            </button>
          </div>
        </form>
    </>
  );
};

export const PluginRow = ({ plugin, removePlugin }: PluginRowProps) => {
  const [showEditModal, setEditShowModal] = useState(false);
  return (
    <tr>
      <td>{plugin.name}</td>
      <td>{plugin.url}</td>
      <td>
        <PluginDetail plugin={plugin} />
        <button aria-label={`edit ${plugin.name} plugin`} onClick={() => {
              setEditShowModal(true);
            }}>
        <PencilIcon className="h-4 w-4" />
      </button>
      {showEditModal && <ModalDialog heading={'Edit plugin'} setShowModal={setEditShowModal}><PluginEdit plugin={plugin} /></ModalDialog>}

        <PluginDelete plugin={plugin} removePlugin={removePlugin} />
      </td>
    </tr>
  );
};

export const Plugins = () => {
  const { data } = useGetPlugins();
  const deletePlugin = useDeletePlugin();
  const [showModal, setShowModal] = useState(false);
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
      {showModal && <ModalDialog heading={'Add plugin'} setShowModal={setShowModal}><PluginAdd /></ModalDialog>}
      <button className="h-9" name="Add Plugin" aria-label="add plugin" onClick={() => {
              setShowModal(true);
            }}>
        Add Plugin
      </button>
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
