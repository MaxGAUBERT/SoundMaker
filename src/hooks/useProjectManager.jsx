import { useChannels } from "../Contexts/features/ChannelProvider";
import { usePlaylist } from "../Contexts/features/PlaylistProvider";
import { useTransport } from "../Contexts/features/TransportContext";
import { useStorage } from "../Contexts/system/StorageContext";

export default function useProjectManager() {

  const channels  = useChannels();
  const playlist  = usePlaylist();
  const transport = useTransport();
  const storage   = useStorage();


  const collect = () => ({
    meta: { version: 1 },

    channels:  channels.getChannelStates(), 
    playlist:  playlist.getState(),
    transport: transport.getState()
  });


  const save = () => {

    if (!storage.currentProjectId) return;

    const data = collect();

    storage.saveProject(storage.currentProjectId, data);
  };


  const saveAs = (name) => {

    const data = collect();

    const project = storage.createProject(name, data); // ✅ un seul appel

    if (!project) {
      console.error("createProject failed");
      return;
    }
  };


  const load = (id) => {

    const data = storage.loadProject(id);

    if (!data) return;

    channels.setState(data.channels);
    playlist.setState(data.playlist);
    transport.setState(data.transport);

    storage.setCurrentProjectId(id);
  };

  const newProject = () => {
    channels.reset();
    playlist.reset();
    transport.reset();

    storage.setCurrentProjectId(null);
  };


  return { save, saveAs, load, newProject };
}