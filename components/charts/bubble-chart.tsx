import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type BubbleDatum = {
  address: string;       // wallet address
  balance: number;       // balance
  balanceFormatted: string; // formatted balance
  percentage: number;    // percentage of supply
  category: string;      // category for colors
  size?: number;         // bubble size
};

type BubbleChartProps = {
  data: BubbleDatum[];
  symbol: string;
  width?: number;
  height?: number;
};

const BubbleChart: React.FC<BubbleChartProps> = ({
  data,
  symbol,
  width = 500,
  height = 500,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Custom tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    datum: BubbleDatum | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    datum: null,
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear previous render

    // Setup color palette based on categories
    const color = d3
      .scaleOrdinal<string>()
      .domain(['Whales (>1%)', 'Large (0.1-1%)', 'Medium (0.01-0.1%)', 'Small (<0.01%)'])
      .range(['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']); 

    // Size scale based on percentage
    // Ensure the minimum size is not too small (e.g., 28px), and max is not too large
    const size = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.percentage) || 1])
      .range([10, 35]); // Smaller range for mobile compatibility

    // Simulation with stronger centering and enough collision to keep bubbles visible
    const simulation = d3
      .forceSimulation<d3.SimulationNodeDatum>(data as d3.SimulationNodeDatum[])
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.25)) // stronger centering
      .force(
        "collide",
        d3.forceCollide().radius((d: any) => size(d.percentage) + 2).strength(1.1) // add padding, strong collision
      )
      .force("x", d3.forceX(width / 2).strength(0.08)) // gentle horizontal centering
      .force("y", d3.forceY(height / 2).strength(0.08)) // gentle vertical centering
      .on("tick", () => {
        node
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y);
      });

    // Initialize nodes
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("r", (d) => size(d.percentage))
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .style("fill", (d) => color(d.category))
      .style("fill-opacity", 0.85)
      .attr("stroke", "hsl(var(--border))")
      .style("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event: MouseEvent, d: BubbleDatum) {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          datum: d,
        });
        d3.select(this).attr("stroke-width", 3);
      })
      .on("mousemove", function (event: MouseEvent, d: BubbleDatum) {
        setTooltip({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          datum: d,
        });
      })
      .on("mouseleave", function () {
        setTooltip({
          visible: false,
          x: 0,
          y: 0,
          datum: null,
        });
        d3.select(this).attr("stroke-width", 1.5);
      });

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  // Custom tooltip component
  const CustomTooltip = ({
    visible,
    x,
    y,
    datum,
  }: {
    visible: boolean;
    x: number;
    y: number;
    datum: BubbleDatum | null;
  }) => {
    if (!visible || !datum) return null;
    // Offset for tooltip so it doesn't cover the mouse
    const style: React.CSSProperties = {
      position: "fixed",
      left: x + 16,
      top: y - 8,
    //   pointerEvents: "none",
    //   background: "rgba(30, 32, 38, 0.98)", // fallback dark background
    //   backgroundColor: "hsl(var(--background), 0.98)",
    //   border: "1px solid hsl(var(--border))",
    //   borderRadius: 10,
    //   padding: "16px 18px 14px 18px",
    //   boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
    //   zIndex: 10000,
    //   minWidth: 220,
    //   color: "hsl(var(--foreground))",
    //   fontSize: 14,
    //   fontFamily: "inherit",
    //   lineHeight: 1.5,
    //   transition: "opacity 0.1s",
    //   opacity: visible ? 1 : 0,
    };
    return (
      <div className="rounded-xl border border-border bg-background/95 shadow-lg px-5 py-4 min-w-[220px] text-[14px] font-normal text-foreground pointer-events-none z-50" style={style}>
        <div className="font-bold mb-2 text-[15px]">Wallet Details</div>
        <div className="mb-1">
          <span className="text-muted-foreground">Address:</span>{" "}
          <span className="font-medium">
            {datum.address.slice(0, 6)}...{datum.address.slice(-4)}
          </span>
        </div>
        <div className="mb-1">
          <span className="text-muted-foreground">Balance:</span>{" "}
          <span className="font-semibold">{Number(Number(datum.balanceFormatted).toFixed(2)).toLocaleString()} {symbol}</span>
        </div>
        <div className="mb-1">
          <span className="text-muted-foreground">% of Supply:</span>{" "}
          <span className="font-semibold">{datum.percentage.toFixed(4)}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Category:</span>{" "}
          <span className="font-semibold">{datum.category}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[300px] lg:min-h-[550px] relative flex justify-center items-center">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        style={{ minWidth: '300px', minHeight: '300px', maxWidth: '100%', maxHeight: '100%', display: "block" }}
      />
      <CustomTooltip {...tooltip} />
    </div>
  );
};

export default BubbleChart;
