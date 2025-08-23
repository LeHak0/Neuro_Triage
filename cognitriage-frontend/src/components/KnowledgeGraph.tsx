import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  label: string;
  type: 'patient' | 'volume' | 'score' | 'risk' | 'finding';
  value?: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  relationship: string;
  strength?: number;
}

interface KnowledgeGraphProps {
  data: any;
  width?: number;
  height?: number;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ 
  data, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create nodes and links from neuroimaging data
    // Access data through the correct structure: data.note.imaging_findings
    const imagingFindings = data.note?.imaging_findings;
    const patientAge = 72; // Demo patient age
    const patientSex = 'M'; // Demo patient sex
    
    const nodes: Node[] = [
      {
        id: 'patient',
        label: `Patient (${patientAge}y, ${patientSex})`,
        type: 'patient',
        color: '#4f46e5'
      },
      {
        id: 'left_hippocampus',
        label: `Left Hippocampus\n${imagingFindings?.hippocampal_volumes_ml?.left_ml?.toFixed(1) || '0.0'}ml`,
        type: 'volume',
        value: imagingFindings?.hippocampal_volumes_ml?.left_ml || 0,
        color: '#06b6d4'
      },
      {
        id: 'right_hippocampus',
        label: `Right Hippocampus\n${imagingFindings?.hippocampal_volumes_ml?.right_ml?.toFixed(1) || '0.0'}ml`,
        type: 'volume',
        value: imagingFindings?.hippocampal_volumes_ml?.right_ml || 0,
        color: '#06b6d4'
      },
      {
        id: 'mta_score',
        label: `MTA Score: ${imagingFindings?.mta_score || 0}`,
        type: 'score',
        color: '#f59e0b'
      },
      {
        id: 'brain_volume',
        label: `Total Brain\n${(imagingFindings?.brain_volumes?.total_brain_ml || imagingFindings?.brain_volumes_ml?.total_brain_ml || 0)?.toFixed?.(0) || '0'}ml`,
        type: 'volume',
        color: '#10b981'
      },
      {
        id: 'risk_level',
        label: `Risk: ${data.triage?.risk_tier || 'Unknown'}`,
        type: 'risk',
        color: data.triage?.risk_tier === 'High' ? '#ef4444' : 
              data.triage?.risk_tier === 'Medium' ? '#f59e0b' : '#10b981'
      }
    ];

    const links: Link[] = [
      { source: 'patient', target: 'left_hippocampus', relationship: 'has_structure' },
      { source: 'patient', target: 'right_hippocampus', relationship: 'has_structure' },
      { source: 'patient', target: 'brain_volume', relationship: 'has_volume' },
      { source: 'left_hippocampus', target: 'mta_score', relationship: 'contributes_to' },
      { source: 'right_hippocampus', target: 'mta_score', relationship: 'contributes_to' },
      { source: 'mta_score', target: 'risk_level', relationship: 'determines' },
      { source: 'brain_volume', target: 'risk_level', relationship: 'influences' }
    ];

    // Set up SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create force simulation
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create gradient definitions
    const defs = svg.append('defs');
    
    // Create arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#64748b')
      .style('stroke', 'none');

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#64748b')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Create link labels
    const linkLabel = svg.append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text(d => d.relationship);

    // Create node groups
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    nodeGroup.append('circle')
      .attr('r', d => d.type === 'patient' ? 25 : 20)
      .attr('fill', d => d.color || '#64748b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))');

    // Add labels to nodes
    nodeGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .style('pointer-events', 'none')
      .selectAll('tspan')
      .data(d => d.label.split('\n'))
      .enter()
      .append('tspan')
      .attr('x', 0)
      .attr('dy', (_, i) => i === 0 ? '-0.2em' : '1.2em')
      .text(d => d);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      linkLabel
        .attr('x', d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr('y', d => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      nodeGroup
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = undefined;
      d.fy = undefined;
    }

  }, [data, width, height]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Neuroimaging Knowledge Graph
      </h3>
      <div className="flex justify-center">
        <svg ref={svgRef} className="border border-gray-200 rounded"></svg>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Interactive visualization showing relationships between brain structures, volumes, and risk assessment.</p>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
