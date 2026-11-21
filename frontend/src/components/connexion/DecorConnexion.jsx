
export default function DecorConnexion() {
  return (
    <div className="decor" aria-hidden="true">
      <div className="points" />
      <div className="grand">
        <span className="bord" /><span className="piste" />
        <div className="orbite"><span className="trainee" /><span className="bille" /></div>
      </div>
      <div className="sphere" />
      <div className="bulle" />
      <div className="arc-g" />
      <div className="arc-d" />
      {[[20, 0, 6], [62, 3, 6], [84, 6, 6], [40, 4.5, 4]].map(([x, d, t]) => (
        <i key={x} className="etincelle" style={{ left: `${x}%`, bottom: -10, animationDelay: `${d}s`, width: t, height: t }} />
      ))}
    </div>
  )
}