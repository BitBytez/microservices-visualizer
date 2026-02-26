# Microservices Visualizer

A dynamic, interactive visualization tool for mapping microservice architectures and monitoring their dependencies in real-time.

*Vibe-coded by Antigravity.*

## 🎯 What it does
Microservices Visualizer provides a spatial, node-based canvas (powered by React Flow) that lets you map out your system architecture. Instead of digging through endless lists or monolithic dashboards, you can clearly see the topology of your Gateways, Services, Databases, Caches, and Message Queues.

Critically, it treats the **connections** between services as first-class citizens. You can embed Grafana dashboards (or any iframe-able metric) directly onto the edges connecting your services.

## 🛠 Problems it Solves
- **Context Switching**: Developers and SREs often have to constantly switch between static architecture diagrams and separate monitoring dashboards. This UI brings the metrics *to* the architecture map.
- **Dependency Blindspots**: When an incident occurs, it's hard to visualize *how* a failing service impacts downstream dependencies. By visualizing the graph, the blast radius becomes intuitively obvious.
- **Granular Monitoring**: Monolithic dashboards often fail to highlight issues on specific communication edges (e.g., tracking latency *specifically* between the API Gateway and the Auth Service). By pinning metrics directly to the dependency edges, you get granular, connection-specific insights.
- **Side-by-side Comparison**: The app allows you to pin multiple metric panels directly on the canvas, letting you monitor the health of entirely different service branches simultaneously.

## ✨ Key Features
- **Interactive Graph**: Drag, pan, and zoom around your architecture. Nodes and connection lines react smoothly to your layout changes.
- **Inline Metrics**: Pin Grafana metric panels directly onto the canvas to watch metrics precisely where the data flows.
- **Draggable Edge Labels**: Customize your layout by dragging connection labels and their associated metrics anywhere on the screen; the lines will bend to follow them.
- **State Persistence & Export**: Layouts and configurations are saved to your browser's local storage automatically. You can also export/import your entire architecture as JSON.
- **Customizable Aesthetics**: Dark-mode native, with smooth flow animations that can be toggled on or off to reduce distraction.

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

## 🤖 Credits
This application was entirely vibe-coded. Built using React, TypeScript, Tailwind CSS, Zustand, and React Flow.
