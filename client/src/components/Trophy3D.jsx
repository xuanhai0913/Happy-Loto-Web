/**
 * Trophy3D - Renders the 3D trophy model using model-viewer
 * Auto-rotates and can be interacted with (drag to rotate)
 */
export default function Trophy3D({ size = 200, autoRotate = true, className = "" }) {
    return (
        <model-viewer
            src="/3d/trophy.glb"
            alt="Cúp vô địch Loto"
            auto-rotate={autoRotate ? "" : undefined}
            auto-rotate-delay="0"
            rotation-per-second="30deg"
            camera-controls
            disable-zoom
            interaction-prompt="none"
            shadow-intensity="1"
            shadow-softness="0.8"
            exposure="1.2"
            environment-image="neutral"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                display: "block",
                margin: "0 auto",
                "--poster-color": "transparent",
            }}
            className={className}
        />
    );
}
