🚀 Portfolio Projects
This document tracks current and future portfolio projects.
These systems focus on building explainable intelligence platforms that transform complex signals into meaningful insights and decision support.
🧠 Core Philosophy
Across all projects:
🔍 Explainable intelligence
📊 Measurable signals
⚠️ Risk-aware outputs
🧩 Modular system architecture
⚙️ Practical MVP-first development
1️⃣ Sideline Studio
🏈 NFL Intelligence Platform
Concept
Sideline Studio is a probabilistic football intelligence system designed to explain:
what happened
why it happened
what is likely to happen next
The system prioritizes interpretability and reasoning rather than black-box predictions.
Core Principles
📊 Confidence visibility
📏 Sample-size awareness
⚠️ Risk-aware outputs
🧠 Decision support rather than predictions
Current Stack
Frontend
React
Vite
Backend
Node.js
Express
MongoDB (staging)
Planned Architecture Evolution
PostgreSQL analytics backbone
Tendency modeling engine
Decision engine
Simulation engine
Play outcome probability modeling
Subscription system
Major System Pipeline
Play Data Processing
↓
Signal Extraction
↓
Tendency Modeling
↓
Probability Engine
↓
Decision Engine
↓
Explanation Layer
↓
User Interface
2️⃣ AI Jumpshot Coach
🏀 Local Motion Analysis System
Concept
A local-first sports technique coaching system that analyzes basketball shooting mechanics.
Pipeline:
video
→ pose detection
→ motion phases
→ biomechanics metrics
→ explainable feedback
The LLM explains analysis results but does not generate the analysis itself.
Current MVP Stack
Backend
FastAPI
Frontend
Electron
React
Current Endpoints
upload
analyze
chat
Early Metrics
knee bend depth
vertical drift
release alignment
System Pipeline
Video Input
↓
Pose Detection
↓
Phase Segmentation
↓
Biomechanics Metrics
↓
Analysis Engine
↓
LLM Explanation
3️⃣ FishDex
🎣 Fishing Intelligence Platform
Concept
FishDex converts environmental signals into explainable fishing recommendations.
The system analyzes real-world conditions to recommend:
🎯 target species
🎣 rig setup
🧭 fishing strategy
🐟 fight strategy
Environmental Signals
weather
tides
alerts
water conditions
access mode
Example Output
Target Species: Red Drum

Drivers
+ outgoing tide
+ optimal water temperature
+ wind direction favorable

Confidence: Medium
Integrations
NOAA weather
NOAA tides
NOAA alerts
iNaturalist species API
Tech Stack
Node.js
Express
JavaScript frontend
Future Direction
Personal catch analytics
Environmental scoring engine
Species intelligence improvements
4️⃣ Controller Lab
🎮 Controller Precision Training System
Concept
Controller Lab is a performance engineering tool designed to measure and improve controller stick precision.
The system tracks stick behavior and produces metrics for fine motor control.
Current Features
Input polling
Real-time stick visualization
Micro-adjust drills
Reaction timing metrics
Overshoot detection
Jitter detection
Session logging
Session data is stored as JSON for later analysis.
Architecture
Controller Input
↓
Input Processing
↓
Drill System
↓
Metrics Engine
↓
Session Storage
Tech Stack
C#
.NET console application
Modular architecture
Modules include:
input
drills
metrics
data
Future Feature
🔫 Recoil Mapping Mode
Import gameplay footage and analyze recoil control.
Features:
recoil trace extraction
player control comparison
pattern analysis
5️⃣ Market Signals Engine
📈 Stock Market Intelligence System (Future Idea)
Concept
A system that analyzes stock market signals and produces explainable insights about market conditions.
Instead of predicting prices, the system explains the forces influencing the market.
Signals analyzed:
momentum
volatility
volume pressure
relative strength
sector breadth
Example Output
Market Signal: Moderately Bullish

Drivers
+ strong trend
+ increasing buy volume

Risks
- elevated volatility

Confidence: 0.63
Potential Features
signal engine
decision scoring engine
explanation generator
strategy backtesting
market dashboard
Potential Data Sources
Alpha Vantage
Polygon
Yahoo Finance
Stooq
6️⃣ Strategy Game Analyzer
♟️ Gameplay Strategy Analysis System (Future Idea)
Concept
A system that analyzes player decision patterns in strategy games and produces insights about tactics and performance.
Possible game targets:
chess
poker
RTS games
turn-based strategy games
Example Insight
Aggressive openings increase win rate by 12%.

However:
Loss rate increases when attacking without resource advantage.
System Pipeline
Game Logs
↓
Parser
↓
Pattern Detection
↓
Strategy Analysis
↓
Insight Generator
7️⃣ System Architecture Visualizer
🧩 Developer Tool for Codebase Architecture (Future Idea)
Concept
A developer tool that scans a codebase and generates architecture diagrams automatically.
The system detects:
modules
dependencies
service relationships
Example Output
API Layer
 → services
 → database layer

Warning:
Circular dependency detected between modules.
Core Components
File scanner
Dependency analyzer
Graph builder
Visualization engine
Visualization Tools
D3.js
graph visualization libraries
diagram rendering tools
🎯 Portfolio Focus
These projects explore systems that convert complex signals into explainable insights.
Domains include:
sports intelligence
environmental intelligence
motion analysis
controller performance engineering
financial signals
strategy analysis
developer tooling
The overarching theme is building interpretable systems rather than opaque predictions.