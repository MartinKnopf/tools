import { useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import './App.css';
import {
  getDrawingList,
  getDrawingData,
  createDrawing,
  saveDrawingData,
  renameDrawing,
  deleteDrawing,
} from './storage';

/**
 * Main App component with sidebar and Excalidraw canvas
 */
export default function App() {
  const [drawings, setDrawings] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [apiReady, setApiReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const excalidrawAPI = useRef(null);
  const saveTimerRef = useRef(null);
  const [, forceUpdate] = useState({});
  const isInitializing = useRef(false);

  // Initialize: load drawings and create first drawing if needed
  useEffect(() => {
    let list = getDrawingList();

    if (list.length === 0) {
      const firstDrawing = createDrawing('Drawing 1');
      list = [firstDrawing];
    }

    setDrawings(list);
    isInitializing.current = true;
    setActiveId(list[0].id);
  }, []);

  // Allow saves after Excalidraw has processed initialData
  useEffect(() => {
    if (!activeId || !apiReady) return;

    // Reinforce stored background color via imperative API
    if (excalidrawAPI.current) {
      const data = getDrawingData(activeId);
      if (data?.appState?.viewBackgroundColor) {
        excalidrawAPI.current.updateScene({
          appState: { viewBackgroundColor: data.appState.viewBackgroundColor },
        });
      }
    }

    // Allow saves after Excalidraw has processed initialData
    const timer = setTimeout(() => {
      isInitializing.current = false;
    }, 300);
    return () => {
      clearTimeout(timer);
      isInitializing.current = false;
    };
  }, [activeId, apiReady]);

  // Flush save before switching drawings
  const flushSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (activeId && excalidrawAPI.current) {
      const elements = excalidrawAPI.current.getSceneElements();
      const appState = excalidrawAPI.current.getAppState();
      const files = excalidrawAPI.current.getFiles();

      saveDrawingData(activeId, { elements, appState, files });
    }
  };

  // Handle Excalidraw onChange with debounced auto-save
  const handleChange = (elements, appState, files) => {
    if (!activeId || isInitializing.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveDrawingData(activeId, { elements, appState, files });
      saveTimerRef.current = null;
    }, 300);
  };

  // Switch to a different drawing
  const switchDrawing = (id) => {
    if (id === activeId) return;

    flushSave();
    isInitializing.current = true;
    setApiReady(false);
    setActiveId(id);
  };

  // Create new drawing
  const handleNewDrawing = () => {
    flushSave();

    const newDrawing = createDrawing(`Drawing ${drawings.length + 1}`);
    const updatedDrawings = [...drawings, newDrawing];
    setDrawings(updatedDrawings);
    isInitializing.current = true;
    setApiReady(false);
    setActiveId(newDrawing.id);

    // Force update to refresh color indicators
    setTimeout(() => forceUpdate({}), 50);
  };

  // Start renaming a drawing
  const startRename = (id, currentName) => {
    setEditingId(id);
    setEditName(currentName);
  };

  // Commit rename
  const commitRename = () => {
    if (editingId && editName.trim()) {
      renameDrawing(editingId, editName.trim());
      setDrawings(getDrawingList());
    }
    setEditingId(null);
    setEditName('');
  };

  // Cancel rename
  const cancelRename = () => {
    setEditingId(null);
    setEditName('');
  };

  // Delete a drawing
  const handleDelete = (id) => {
    if (drawings.length === 1) {
      alert('Cannot delete the last drawing');
      return;
    }

    if (!confirm('Delete this drawing?')) {
      return;
    }

    deleteDrawing(id);
    const newList = getDrawingList();
    setDrawings(newList);

    if (id === activeId) {
      setActiveId(newList[0].id);
    }
  };

  // Get initial data for active drawing - ensure it's always a valid structure
  const getInitialData = () => {
    if (!activeId) return null;
    const data = getDrawingData(activeId);
    if (!data) return null;

    return {
      elements: data.elements || [],
      appState: data.appState || {},
      files: data.files || {},
    };
  };

  return (
    <div className="app">
      <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            {sidebarOpen && <h1>LocalDraw</h1>}
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '\u00AB' : '\u00BB'}
            </button>
          </div>
          {sidebarOpen && (
            <button className="new-drawing-btn" onClick={handleNewDrawing}>
              + New Drawing
            </button>
          )}
        </div>
        <div className="drawing-list">
          {sidebarOpen && drawings.map((drawing) => {
            const drawingData = getDrawingData(drawing.id);
            const bgColor = drawingData?.appState?.viewBackgroundColor || '#121212';

            return (
              <div
                key={drawing.id}
                className={`drawing-item ${drawing.id === activeId ? 'active' : ''}`}
                onClick={() => editingId !== drawing.id && switchDrawing(drawing.id)}
              >
                <div
                  className="drawing-color-indicator"
                  style={{ backgroundColor: bgColor }}
                  title={`Background: ${bgColor}`}
                />
                {editingId === drawing.id ? (
                  <input
                    className="drawing-name-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="drawing-name"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(drawing.id, drawing.name);
                    }}
                  >
                    {drawing.name}
                  </span>
                )}
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(drawing.id);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="canvas-area">
        {activeId && (
          <div key={activeId} className="excalidraw-wrapper">
            <Excalidraw
              theme="dark"
              excalidrawAPI={(api) => {
                excalidrawAPI.current = api;
                if (api) {
                  setApiReady(true);
                }
              }}
              initialData={getInitialData()}
              onChange={handleChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
