import React, { useState } from "react";
import BoidSketch from "./BoidSketch";

function App() {
  const [boidCount, setBoidCount] = useState(30);
  const [predatorTrigger, setPredatorTrigger] = useState(0);

  const addPredator = () => setPredatorTrigger(prev => prev + 1);

  return (
    <div>
      <h1>Boids モデル</h1>

      <button onClick={() => setBoidCount(Math.max(0, boidCount - 10))}>
        10減少
      </button>
      <button onClick={() => setBoidCount(boidCount + 10)}>
        10追加
      </button>

      <button onClick={addPredator}>捕食者を追加</button>

      <BoidSketch
        boidCount={boidCount}
        triggerAddPredator={predatorTrigger}
      />
    </div>
  );
}

export default App;
