import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Helper Hook for Window Size ---
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};


// --- Helper Icons (as components) ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const RefreshCwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path><path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path></svg>;

// --- Simulation Constants ---
const NODE_IDS = ['A', 'B', 'C', 'D', 'E'];
const SIMULATION_SPEED = 1000; // ms per tick
const PACKET_TTL = 100;

// --- Initial Network Configuration ---
const INITIAL_NODES_CONFIG = {
  'A': { id: 'A', x: 50, y: 15 },
  'B': { id: 'B', x: 20, y: 40 },
  'C': { id: 'C', x: 35, y: 85 },
  'D': { id: 'D', x: 65, y: 85 },
  'E': { id: 'E', x: 80, y: 40 },
};

const INITIAL_LINKS_CONFIG = [
  { from: 'A', to: 'B', capacity: 100 },
  { from: 'A', to: 'C', capacity: 80 },
  { from: 'B', to: 'D', capacity: 70 },
  { from: 'C', to: 'D', capacity: 90 },
  { from: 'C', to: 'E', capacity: 100 },
  { from: 'D', to: 'E', capacity: 60 },
];

const INITIAL_TRAFFIC_RATES = { 'A': 50, 'B': 30, 'C': 40, 'D': 20, 'E': 60 };

// --- Shortest Path Algorithm (BFS) ---
const calculateShortestPaths = (nodes, links) => {
  const paths = {};
  const adj = {};
  nodes.forEach(nodeId => { adj[nodeId] = []; paths[nodeId] = {}; });
  links.forEach(({ from, to }) => { adj[from].push(to); adj[to].push(from); });

  nodes.forEach(startNode => {
    nodes.forEach(endNode => {
      if (startNode === endNode) { paths[startNode][endNode] = [startNode]; return; }
      const queue = [[startNode]];
      const visited = new Set([startNode]);
      while (queue.length > 0) {
        const path = queue.shift();
        const lastNode = path[path.length - 1];
        if (lastNode === endNode) { paths[startNode][endNode] = path; return; }
        adj[lastNode].forEach(neighbor => {
          if (!visited.has(neighbor)) { visited.add(neighbor); queue.push([...path, neighbor]); }
        });
      }
    });
  });
  return paths;
};

const shortestPaths = calculateShortestPaths(NODE_IDS, INITIAL_LINKS_CONFIG);

// --- Styles Object ---
const styles = {
  container: { backgroundColor: '#111827', color: 'white', height: '100vh', width: '100vw', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box', overflow: 'hidden' },
  header: { marginBottom: '1rem', padding: '0 1rem', flexShrink: 0 },
  h1: { fontSize: '2rem', fontWeight: 'bold', color: '#22d3ee' },
  p: { color: '#9ca3af', fontSize: '0.875rem' },
  mainLayout: { flexGrow: 1, display: 'flex', gap: '1.5rem', minHeight: 0 },
  panel: { backgroundColor: '#1f2937', borderRadius: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #374151', padding: '1.5rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  mainPanel: { flex: '3 1 0%', position: 'relative', overflow: 'hidden' },
  asidePanel: { flex: '1 1 340px', minWidth: '320px', overflow: 'hidden' },
  controlsHeader: { fontSize: '1.5rem', fontWeight: '600', color: '#22d3ee', borderBottom: '1px solid #4b5563', paddingBottom: '0.75rem', marginBottom: '1rem', flexShrink: 0 },
  controlsWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexShrink: 0 },
  button: { padding: '0.75rem', backgroundColor: '#374151', borderRadius: '9999px', cursor: 'pointer', border: 'none', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.875rem' },
  statsHeader: { fontWeight: 'bold', color: '#9ca3af' },
  statsCell: { backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' },
  progressBarContainer: { width: '100%', backgroundColor: '#4b5563', borderRadius: '9999px', height: '0.625rem' },
  linkStatText: { fontWeight: 'bold', whiteSpace: 'nowrap' },
  scrollableArea: { flexGrow: 1, overflowY: 'auto', paddingRight: '1rem', marginRight: '-1rem' },
  input: { width: '100%', backgroundColor: '#374151', border: '1px solid #4b5563', borderRadius: '0.25rem', color: 'white', padding: '0.25rem 0.5rem', textAlign: 'center', fontFamily: 'monospace' },
  paramGrid: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', alignItems: 'center' }
};

// --- Main App Component ---
export default function App() {
  const [nodes, setNodes] = useState(() => Object.values(INITIAL_NODES_CONFIG).reduce((acc, node) => ({ ...acc, [node.id]: { ...node, queue: [], trafficGenerated: 0 } }), {}));
  const [links, setLinks] = useState(() => INITIAL_LINKS_CONFIG.map(link => ({ ...link, id: `${link.from}-${link.to}`, load: 0 })));
  const [trafficRates, setTrafficRates] = useState(INITIAL_TRAFFIC_RATES);
  const [packets, setPackets] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0);
  const simulationInterval = useRef(null);
  const [width] = useWindowSize();

  const handleTrafficRateChange = (nodeId, value) => {
    const newRate = parseInt(value, 10);
    if (!isNaN(newRate)) {
      setTrafficRates(prev => ({ ...prev, [nodeId]: newRate }));
    }
  };

  const handleLinkCapacityChange = (linkId, value) => {
    const newCapacity = parseInt(value, 10);
    if (!isNaN(newCapacity)) {
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, capacity: newCapacity } : l));
    }
  };

  const runSimulationTick = useCallback(() => {
    // Perform all calculations first, then update state once.
    const linkLoadMap = {};
    links.forEach(l => {
      linkLoadMap[`${l.from}-${l.to}`] = 0;
      linkLoadMap[`${l.to}-${l.from}`] = 0;
    });

    const nextNodes = JSON.parse(JSON.stringify(nodes));
    Object.values(nextNodes).forEach(n => n.trafficGenerated = 0);
    
    const packetsFromQueue = [];
    Object.keys(nextNodes).forEach(nodeId => {
      packetsFromQueue.push(...nextNodes[nodeId].queue);
      nextNodes[nodeId].queue = [];
    });

    const packetsToProcess = [...packetsFromQueue, ...packets];
    const nextPackets = [];

    packetsToProcess.forEach(p => {
      if (p.atNode === p.destination || p.ttl <= 0) return;
      const nextNodeId = p.path[p.currentHop + 1];
      if (!nextNodeId) return;

      const link = links.find(l => (l.from === p.atNode && l.to === nextNodeId) || (l.from === nextNodeId && l.to === p.atNode));
      const totalCurrentLoad = linkLoadMap[`${p.atNode}-${nextNodeId}`] + linkLoadMap[`${nextNodeId}-${p.atNode}`];

      if (link && totalCurrentLoad < link.capacity) {
        linkLoadMap[`${p.atNode}-${nextNodeId}`]++;
        nextPackets.push({ ...p, currentHop: p.currentHop + 1, atNode: nextNodeId, ttl: p.ttl - 1 });
      } else {
        nextNodes[p.atNode].queue.push({ ...p, ttl: p.ttl - 1 });
      }
    });

    NODE_IDS.forEach(nodeId => {
      const packetsToGenerate = Math.floor(trafficRates[nodeId] / (1000 / SIMULATION_SPEED));
      nextNodes[nodeId].trafficGenerated = packetsToGenerate;
      for (let i = 0; i < packetsToGenerate; i++) {
        let dest = NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)];
        while (dest === nodeId) { dest = NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)]; }
        nextPackets.push({ id: `pkt-${Date.now()}-${Math.random()}`, source: nodeId, destination: dest, path: shortestPaths[nodeId][dest], currentHop: 0, atNode: nodeId, ttl: PACKET_TTL });
      }
    });

    const nextLinks = links.map(l => ({
      ...l,
      load: linkLoadMap[`${l.from}-${l.to}`] + linkLoadMap[`${l.to}-${l.from}`]
    }));

    // Update all states at once at the end of the tick.
    setNodes(nextNodes);
    setPackets(nextPackets);
    setLinks(nextLinks);
    setSimulationTime(t => t + 1);

  }, [nodes, links, packets, trafficRates]);

  useEffect(() => {
    if (isRunning) {
      simulationInterval.current = setInterval(runSimulationTick, SIMULATION_SPEED);
    } else {
        clearInterval(simulationInterval.current);
    }
    return () => clearInterval(simulationInterval.current);
  }, [isRunning, runSimulationTick]);

  const handleStartPause = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setIsRunning(false);
    clearInterval(simulationInterval.current);
    setSimulationTime(0);
    setNodes(() => Object.values(INITIAL_NODES_CONFIG).reduce((acc, node) => ({ ...acc, [node.id]: { ...node, queue: [], trafficGenerated: 0 } }), {}));
    setLinks(() => INITIAL_LINKS_CONFIG.map(link => ({ ...link, id: `${link.from}-${link.to}`, load: 0 })));
    setTrafficRates(INITIAL_TRAFFIC_RATES);
    setPackets([]);
  };

  const isMobile = width < 1024;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Network Traffic Simulator</h1>
        <p style={styles.p}>A simplified simulation of data packets moving through a network.</p>
      </header>

      <div style={{ ...styles.mainLayout, flexDirection: isMobile ? 'column' : 'row' }}>
        <main style={{ ...styles.panel, ...styles.mainPanel }}>
  <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
    <svg 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundColor: '#1f2937'
      }} 
      viewBox="0 0 100 100" 
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Links with proper styling and labels */}
      {links.map(link => {
        const fromNode = nodes[link.from];
        const toNode = nodes[link.to];
        if (!fromNode || !toNode) return null;
        
        const percentage = Math.min((link.load / link.capacity) * 100, 100);
        let strokeColor = "#22d3ee";
        if (percentage > 85) strokeColor = "#ef4444";
        else if (percentage > 60) strokeColor = "#eab308";

        // Calculate midpoint with slight offset
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const labelX = midX + Math.sin(angle) * 3;
        const labelY = midY - Math.cos(angle) * 3;

        return (
          <g key={link.id}>
            <line
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={strokeColor}
              strokeWidth={1}
              strokeOpacity={0.8}
            />
            <text
              x={labelX}
              y={labelY}
              fill="#f3f4f6"
              fontSize="3.5"
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {link.load}/{link.capacity}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {Object.values(nodes).map(node => (
        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
          <circle
            cx={0}
            cy={0}
            r="5"
            fill="#374151"
            stroke="#22d3ee"
            strokeWidth="2"
          />
          <text
            x={0}
            y={0}
            fill="#f3f4f6"
            fontSize="5"
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
          >
            {node.id}
          </text>
          <text
            x={0}
            y={8}
            fill="#ffffffff"
            fontSize="3"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            Q: {node.queue.length}
          </text>
        </g>
      ))}

      {/* Packets */}
      {packets.map(packet => {
        const node = nodes[packet.atNode];
        if (!node) return null;
        
        return (<></>
          // <circle
          //   key={packet.id}
          //   cx={node.x}
          //   cy={node.y}
          //   r="1.5"
          //   fill="#a3e635"
          //   stroke="#4d7c0f"
          //   strokeWidth="0.5"
          // />
        );
      })}
    </svg>
  </div>
</main>
        <aside style={{ ...styles.panel, ...styles.asidePanel }}>
          <h2 style={styles.controlsHeader}>Controls & Status</h2>
          <div style={styles.controlsWrapper}>
            <p>Sim Time: <span style={{ fontFamily: 'monospace', color: '#a3e635' }}>{simulationTime}s</span></p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleStartPause} style={styles.button}>{isRunning ? <PauseIcon /> : <PlayIcon />}</button>
              <button onClick={handleReset} style={styles.button}><RefreshCwIcon /></button>
            </div>
          </div>
          <div style={styles.scrollableArea}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#22d3ee', marginBottom: '0.5rem' }}>Network Parameters</h3>
                <div style={{...styles.paramGrid, gridTemplateColumns: '1fr 1fr', marginBottom: '1rem'}}>
                    <div style={styles.statsHeader}>Node</div>
                    <div style={styles.statsHeader}>Traffic (pps)</div>
                </div>
                {Object.keys(trafficRates).sort().map(nodeId => (
                    <div key={nodeId} style={{...styles.paramGrid, gridTemplateColumns: '1fr 1fr', marginBottom: '0.5rem'}}>
                        <div style={{...styles.statsCell, backgroundColor: 'transparent'}}>Node {nodeId}</div>
                        <input type="number" value={trafficRates[nodeId]} onChange={(e) => handleTrafficRateChange(nodeId, e.target.value)} style={styles.input} />
                    </div>
                ))}
                <div style={{...styles.paramGrid, gridTemplateColumns: '1.5fr 1fr', marginTop: '1.5rem', marginBottom: '1rem'}}>
                    <div style={styles.statsHeader}>Link</div>
                    <div style={styles.statsHeader}>Capacity (pps)</div>
                </div>
                {links.map(link => (
                    <div key={link.id} style={{...styles.paramGrid, gridTemplateColumns: '1.5fr 1fr', marginBottom: '0.5rem'}}>
                        <div style={{...styles.statsCell, backgroundColor: 'transparent', whiteSpace: 'nowrap'}}>Link {link.from} &harr; {link.to}</div>
                        <input type="number" value={link.capacity} onChange={(e) => handleLinkCapacityChange(link.id, e.target.value)} style={styles.input} />
                    </div>
                ))}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#22d3ee', marginBottom: '0.5rem' }}>Live Stats</h3>
                <div style={styles.statsGrid}>
                  <div style={styles.statsHeader}>Node</div><div style={styles.statsHeader}>Gen/sec</div><div style={styles.statsHeader}>Queue</div>
                  {Object.values(nodes).sort((a,b) => a.id.localeCompare(b.id)).map(node => (
                    <React.Fragment key={node.id}>
                      <div style={styles.statsCell}>{node.id}</div>
                      <div style={styles.statsCell}>{isRunning ? node.trafficGenerated : 0}</div>
                      <div style={styles.statsCell}>{node.queue.length}</div>
                    </React.Fragment>
                  ))}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#22d3ee', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Link Load</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  {links.map(link => {
                    const percentage = link.capacity > 0 ? Math.min((link.load / link.capacity) * 100, 100) : 0;
                    let barColor = "#22d3ee";
                    if (percentage > 85) barColor = "#ef4444"; else if (percentage > 60) barColor = "#eab308";
                    return (
                      <div key={link.id} style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={styles.linkStatText}>Link {link.from} &harr; {link.to}</span>
                          <span style={{ fontFamily: 'monospace', color: '#d1d5db' }}>{link.load} / {link.capacity} pps</span>
                        </div>
                        <div style={styles.progressBarContainer}><div style={{ backgroundColor: barColor, height: '100%', borderRadius: '9999px', transition: 'width 500ms', width: `${percentage}%` }}></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
