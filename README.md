<h1 align="center">Excellent Academy — Interactive Digital Textbook 2026</h1>

<p align="center">
  An immersive, experiential learning platform designed for 11th and 12th-grade students preparing for NEET, JEE, and Board Exams.
</p>

---

## 📖 About the Product

The **Excellent Academy Digital Textbook** is a next-generation educational tool that brings abstract scientific concepts to life. Moving away from static diagrams and passive reading, this platform offers **real-time, interactive simulations** for fundamental topics in Physics and Chemistry. 

Our core goal is to provide an *“aha moment”* for students by allowing them to manipulate variables, observe immediate dynamic feedback, and visually bridge the gap between complex mathematical equations and observable physical phenomena. 

All simulations are strictly aligned with the **NCERT Curriculum** to ensure direct relevance to student coursework and competitive exam preparation.

## ✨ Key Features

- **Interactive Physics Simulations (11th & 12th Grade):**
  - Thermodynamics (Carnot Engine, Processes)
  - Waves & Oscillations (Standing Waves, SHM)
  - Ray Optics (Lenses, Prisms, and Ray Diagrams)
  - Electromagnetism (Faraday's Law, Transformers)
  - Mechanics (Tensile Testing, Fluid Dynamics)
  
- **Interactive Chemistry Simulations (11th & 12th Grade):**
  - Atomic Structure (Bohr Model Electron Transitions)
  - Chemical Kinetics (Reaction Rates)
  - Electrochemistry (Nernst Equation)
  - Solutions (Raoult's Law)

- **Experiential UX & Dynamic Visualization:**
  - Real-time graphing and data visualization using React Canvas and `recharts`.
  - Pedagogically sound controls (e.g., teaching modes, step-by-step progressions, interactive sliders).
  - Responsive design optimized for both personal laptops and classroom smartboards.

## 🛠️ Technology Stack

This platform is built with modern, high-performance web technologies:

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite (for near-instant HMR and optimized production builds)
- **Styling:** Tailwind CSS (for rapid, responsive UI development)
- **Icons & Graphics:** `lucide-react`
- **Data Visualization:** HTML5 Canvas API & `recharts`

## 🚀 Getting Started

To run this application locally on your machine:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/maluraditya/Excellent-NEET-Experiencial-Learning.git
   cd Excellent-NEET-Experiencial-Learning
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add any necessary keys.
   ```env
   GEMINI_API_KEY=your_gen_ai_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:5173` (or the port specified by Vite).*

### Building for Production

To create a highly optimized production bundle:
```bash
npm run build
```
Then, you can preview the production build locally using:
```bash
npm run preview
```

## 🤝 Contributing & Maintenance

This repository is actively maintained to support the 2026 academic year. New simulations and educational modules are added regularly based on teacher feedback and student curriculum requirements.
