import React, { useEffect, useRef } from 'react';

interface RayOpticsCanvasProps {
    device: 'convex_lens' | 'concave_lens' | 'prism';
}

const RayOpticsCanvas: React.FC<RayOpticsCanvasProps> = ({ device }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Simple interactivity state (could be props, but keeping local for simplicity in this task)
    const objectPosRef = useRef({ x: 100, y: 250 });
    const isDragging = useRef(false);

    useEffect(() => {
        let animationFrameId: number;

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            // --- Draw Optical Axis ---
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            ctx.setLineDash([]);

            const objX = objectPosRef.current.x;
            const objY = objectPosRef.current.y;

            // --- Draw Object (Arrow) ---
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(objX, centerY);
            ctx.lineTo(objX, objY);
            ctx.stroke();
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(objX - 5, objY + (centerY > objY ? 5 : -5));
            ctx.lineTo(objX, objY);
            ctx.lineTo(objX + 5, objY + (centerY > objY ? 5 : -5));
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.fillText('Object', objX - 15, centerY + 20);


            if (device === 'convex_lens') {
                // --- Draw Convex Lens ---
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, 15, 120, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                ctx.fill();
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 1;
                ctx.stroke();

                const f = 100; // Focal length
                // Draw Focus points
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(centerX - f, centerY, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillText('F', centerX - f - 5, centerY + 15);
                ctx.beginPath(); ctx.arc(centerX + f, centerY, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillText('F', centerX + f - 5, centerY + 15);

                // --- Ray Tracing ---
                // 1. Parallel to axis -> passes through focus
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(objX, objY);
                ctx.lineTo(centerX, objY); // hit lens plane
                ctx.lineTo(width, centerY + (objY - centerY) * (-(width - centerX - f) / f)); // Extrapolated line equation y - y1 = m(x - x1)
                // Simplified: it goes through (centerX + f, centerY)
                // Line from (centerX, objY) to (centerX + f, centerY)
                // Slope m = (centerY - objY) / f
                // y = m(x - centerX) + objY (valid for x > centerX)
                // Let's just draw segment to far edge
                const slope1 = (centerY - objY) / f;
                const yEnd1 = centerY + slope1 * (width - centerX - f); // at focus x is f relative to center
                // Actually: y - centerY = m * (x - (centerX+f))
                // At x = centerX, y = objY. 
                // objY - centerY = m * (-f) => m = (centerY - objY) / f
                // Correct.
                const yAtWidth = centerY + slope1 * (width - (centerX + f));
                ctx.lineTo(width, yAtWidth);
                ctx.stroke();

                // 2. Through Optical Center -> undeviated
                ctx.strokeStyle = '#10b981'; // Green
                ctx.beginPath();
                ctx.moveTo(objX, objY);
                // Slope m = (centerY - objY) / (centerX - objX)
                const slope2 = (centerY - objY) / (centerX - objX);
                const yEnd2 = centerY + slope2 * (width - centerX);
                ctx.lineTo(width, yEnd2);
                ctx.stroke();

                // Intersection (Image)
                // Ray 1: y = centerY + slope1 * (x - centerX - f)
                // Ray 2: y = centerY + slope2 * (x - centerX)
                // slope1 * (x - cx - f) = slope2 * (x - cx)
                // slope1*x - slope1*cx - slope1*f = slope2*x - slope2*cx
                // x(slope1 - slope2) = slope1(cx + f) - slope2*cx
                // x = (slope1(cx+f) - slope2*cx) / (slope1 - slope2)
                // Simply use lens formula: 1/v - 1/u = 1/f
                // u = objX - centerX (negative)
                const u = objX - centerX;
                const v = 1 / (1 / f + 1 / u);
                const imageX = centerX + v;
                const m = v / u;
                const imageH = (centerY - objY) * m; // Height relative to axis
                const imageY = centerY - imageH; // Canvas Y

                // Draw Image Arrow
                if (v > 0 && v < width) {
                    ctx.strokeStyle = '#8b5cf6'; // Violet
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(imageX, centerY);
                    ctx.lineTo(imageX, imageY);
                    ctx.stroke();
                    // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(imageX - 5, imageY + (centerY > imageY ? 5 : -5));
                    ctx.lineTo(imageX, imageY);
                    ctx.lineTo(imageX + 5, imageY + (centerY > imageY ? 5 : -5));
                    ctx.stroke();
                    ctx.fillStyle = '#8b5cf6';
                    ctx.fillText('Image', imageX - 15, centerY + 20);
                } else {
                    ctx.fillStyle = '#64748b';
                    ctx.fillText('Virtual Image (Extend Rays Back)', 50, 50);
                }
            } else if (device === 'prism') {
                const side = 150;
                const h = side * Math.sin(Math.PI / 3);
                const px = centerX - side / 2;
                const py = centerY + h / 2;

                ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                ctx.strokeStyle = '#3b82f6';
                ctx.beginPath();
                ctx.moveTo(px, py); // Bottom Left
                ctx.lineTo(px + side, py); // Bottom Right
                ctx.lineTo(centerX, py - h); // Top
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // White Light Ray
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 4;
                // Shadow for white ray effect
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 10;

                // Incident Ray
                ctx.beginPath();
                ctx.moveTo(px - 100, py - 50);
                ctx.lineTo(px + 30, py - 30); // Hit surface roughly
                ctx.stroke();

                // Inside Prism (Dispersion starts)
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;

                const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
                colors.forEach((c, i) => {
                    ctx.strokeStyle = c;
                    ctx.beginPath();
                    ctx.moveTo(px + 30, py - 30);
                    // Refract inside
                    const midY = py - 30 + (i - 2) * 5;
                    ctx.lineTo(centerX + 20, midY);
                    // Refract out
                    ctx.lineTo(centerX + 150 + (i * 10), centerY + 100 + (i * 20));
                    ctx.stroke();
                });

                ctx.fillStyle = '#1e293b';
                ctx.fillText('Dispersion of White Light', 20, 40);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [device]);

    // Handle Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Check if near object
        const dx = x - objectPosRef.current.x;
        const dy = y - objectPosRef.current.y;
        if (Math.hypot(dx, dy) < 30 || Math.abs(x - objectPosRef.current.x) < 20) {
            isDragging.current = true;
        }
    }
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        objectPosRef.current = { x, y };
    }
    const handleMouseUp = () => isDragging.current = false;

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full object-contain cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

export default RayOpticsCanvas;
