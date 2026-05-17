import React from "react";

/**
 * GameProgressBar — segmented question-by-question progress indicator.
 * Props:
 *   total        {number}  – total questions (usually 8)
 *   current      {number}  – 0-based index of the active question
 *   states       {Array}   – array of { resolved, correct } per question
 */
const GameProgressBar = ({ total, current, states }) => {
  return (
    <div className="gpb-wrap" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current + 1}>
      {Array.from({ length: total }, (_, i) => {
        const state = states[i] || {};
        let cls = "gpb-seg";
        if (state.resolved) {
          cls += state.correct ? " correct" : " wrong";
        } else if (i === current) {
          cls += " current";
        }
        return (
          <div key={i} className={cls} title={`Q${i + 1}`}>
            {state.resolved ? (state.correct ? "✓" : "✗") : i === current ? i + 1 : ""}
          </div>
        );
      })}
    </div>
  );
};

export default GameProgressBar;
