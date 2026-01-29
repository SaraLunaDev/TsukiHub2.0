import React from "react";

export default function TutorialPanel({ className = "" }) {
	return (
		<div className={`tts-tutorial-panel ${className}`}>
			<div className="tutorial-section">
				<h3 className="tutorial-title">Como usar las voces</h3>
				<p className="tutorial-text">
					Para usar las voces, escribe el ID de la voz seguido de dos
					puntos entre paréntesis.
				</p>
				<div className="tutorial-example">
					<pre className="tutorial-code">
						<span className="tutorial-voice-tag">(10:)</span> Hola,
						soy Martin.
					</pre>
				</div>
			</div>

			<div className="tutorial-divider"></div>

			<div className="tutorial-section spaced">
				<h3 className="tutorial-title">Combinar voces</h3>
				<p className="tutorial-text">
					Puedes combinar varias voces en el mismo texto:
				</p>
				<div className="tutorial-example">
					<pre className="tutorial-code">
						<span className="tutorial-voice-tag">(10:)</span> Hola,
						soy Martin, y ahora{" "}
						<span className="tutorial-voice-tag">(11:)</span> soy
						Tortugo.
					</pre>
				</div>
			</div>

			<div className="tutorial-divider"></div>

			<div className="tutorial-section spaced">
				<h3 className="tutorial-title">Como usar los sonidos</h3>
				<p className="tutorial-text">
					Para usar los sonidos, escribe el ID del sonido entre
					paréntesis.
				</p>
				<div className="tutorial-example">
					<pre className="tutorial-code">
						Estoy triste..{" "}
						<span className="tutorial-voice-tag sound">(64)</span>,
						voy a beber algo.{" "}
						<span className="tutorial-voice-tag sound">(10)</span>{" "}
						que rico!
					</pre>
				</div>
			</div>

			<div className="tutorial-divider"></div>

			<div className="tutorial-section spaced">
				<h3 className="tutorial-title">Combinar voces y sonidos</h3>
				<p className="tutorial-text">
					Como antes, puedes combinar voces y sonidos.
				</p>
				<div className="tutorial-example">
					<pre className="tutorial-code">
						<span className="tutorial-voice-tag">(10:)</span> Que
						rica esta esta cerveza{" "}
						<span className="tutorial-voice-tag sound">(127)</span>,{" "}
						<span className="tutorial-voice-tag">(11:)</span> Deja
						de beber borracho!{" "}
						<span className="tutorial-voice-tag sound">(100)</span>.
					</pre>
				</div>
			</div>

			<div className="tutorial-divider"></div>

			<div className="tutorial-section spaced">
				<h3 className="tutorial-title">Enviarlo a Twitch</h3>
				<p className="tutorial-text">
					Una vez tengas tu mensaje listo, envialo a Twitch usando el
					punto de canal "TTS" para que se reproduzca.
				</p>
			</div>
		</div>
	);
}
