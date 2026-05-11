import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

type CardNodeData = { label: string }
type CardEdgeData = { edgeType: string }
type CardNode = Node<CardNodeData>
type CardEdge = Edge<CardEdgeData>

const initialNodes: CardNode[] = [
  {
    id: 'central_claim',
    position: { x: 0, y: 0 },
    data: { label: 'central_claim' },
  },
]
const initialEdges: CardEdge[] = []

type Theme = 'light' | 'dark'

function App() {
  const idRef = useRef(2)
  const [nodes, setNodes, onNodesChange] = useNodesState<CardNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<CardEdge>(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    'central_claim',
  )
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: CardEdge = {
        ...params,
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        label: 'supports',
        data: { edgeType: 'supports' },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges],
  )

  const addNode = useCallback(() => {
    const id = `node_${idRef.current++}`
    setNodes((nds) => [
      ...nds,
      {
        id,
        position: {
          x: Math.random() * 400 - 200,
          y: Math.random() * 300 - 150,
        },
        data: { label: id },
      },
    ])
    setSelectedNodeId(id)
  }, [setNodes])

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (deleted.some((n) => n.id === selectedNodeId)) {
        setSelectedNodeId(null)
      }
    },
    [selectedNodeId],
  )

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  const outgoingEdges = useMemo(
    () => edges.filter((e) => e.source === selectedNodeId),
    [edges, selectedNodeId],
  )

  const styledNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        className: n.id === selectedNodeId ? 'node-focused' : '',
      })),
    [nodes, selectedNodeId],
  )

  const styledEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        className: e.source === selectedNodeId ? 'edge-suggested' : '',
        animated: e.source === selectedNodeId,
      })),
    [edges, selectedNodeId],
  )

  return (
    <div className="app">
      <div className="canvas-pane">
        <div className="toolbar">
          <button onClick={addNode}>Add node</button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? 'Dark' : 'Light'} mode
          </button>
          <span className="hint">
            click node to focus · select + Backspace to remove · drag handle
            to connect
          </span>
        </div>
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          deleteKeyCode={['Backspace', 'Delete']}
          colorMode={theme}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
      <aside className="right-pane">
        <section className="content-pane">
          {selectedNode ? (
            <>
              <h2 className="node-id">{selectedNode.data.label}</h2>
              <p className="placeholder">
                Full content (the unfolding) will live here. The on-canvas
                label is a minimal summary; this panel is where the depth
                expands.
              </p>
            </>
          ) : (
            <p className="placeholder">Click a node to focus it.</p>
          )}
        </section>
        <section className="edges-pane">
          <h3>Potential moves</h3>
          {selectedNode == null ? (
            <p className="placeholder">No node focused.</p>
          ) : outgoingEdges.length === 0 ? (
            <p className="placeholder">No outgoing edges from this node.</p>
          ) : (
            <ul className="edge-list">
              {outgoingEdges.map((edge) => {
                const target = nodes.find((n) => n.id === edge.target)
                const label =
                  (typeof edge.label === 'string' && edge.label) ||
                  `→ ${target?.data.label ?? edge.target}`
                const type = edge.data?.edgeType ?? 'supports'
                return (
                  <li
                    key={edge.id}
                    className="edge-item"
                    onClick={() => setSelectedNodeId(edge.target)}
                  >
                    <span className="edge-label">{label}</span>
                    <span className="edge-type">{type}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}

export default App
