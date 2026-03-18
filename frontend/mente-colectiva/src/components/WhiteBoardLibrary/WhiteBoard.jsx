import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../Socket/ws";
import {
    MousePointer2,
    Pencil,
    Square,
    Circle as CircleIcon,
    Type,
    Minus,
    Eraser,
    Undo2,
    Redo2,
    Copy,
    Trash2,
    Layers,
    Ungroup,
    Highlighter,
} from "lucide-react";

//All Tool Object
const Tool = {
    SELECT: "select",
    PEN: "pen",
    RECT: "rect",
    CIRCLE: "circle",
    LINE: "line",
    TEXT: "text",
    ERASER: "eraser",
};

const BG_COLOR = "#020617";

//converting hex to RCBA format
function hexToRGBA(hex, opacity) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}


const Whiteboard = ({ roomId, initialBoard, permittedMember, currentUser, hostName }) => {
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    const hasLoadedInitialBoard = useRef(false);

    const [activeTool, setActiveTool] = useState(Tool.SELECT); //containing Tool 
    const [strokeColor, setStrokeColor] = useState("#3b82f6"); 
    const [fillColor, setFillColor] = useState("transparent");
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [isCanvasReady,setIsCanvasReady] = useState(false);

    const activeToolRef = useRef(activeTool);
    const strokeColorRef = useRef(strokeColor);
    const fillColorRef = useRef(fillColor);
    const strokeWidthRef = useRef(strokeWidth);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { strokeColorRef.current = strokeColor; }, [strokeColor]);
    useEffect(() => { fillColorRef.current = fillColor; }, [fillColor]);
    useEffect(() => { strokeWidthRef.current = strokeWidth; }, [strokeWidth]);


    const undoStack = useRef([]); //undoStack 
    const redoStack = useRef([]); //redoStack
    const isStateChanging = useRef(false);
    const saveTimeout = useRef(null);

    const isMouseDown = useRef(false);
    const currentShape = useRef(null);
    const startPoint = useRef({ x: 0, y: 0 }); 


     // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 64,
            backgroundColor: BG_COLOR,
            isDrawingMode: false,
            selection: true,
            renderOnAddRemove: true,
            enableRetinaScaling: true,
            stateful: true,
        });

        fabricCanvas.current = canvas;
        setIsCanvasReady(true)

        const handleResize = () => {
            canvas.setDimensions({
                width: window.innerWidth,
                height: window.innerHeight - 64,
            });
            canvas.renderAll();
        };

        window.addEventListener("resize", handleResize);

        // Event Listeners
        const handleObjectAdded = () => !isStateChanging.current && saveState();
        const handleObjectModified = () => !isStateChanging.current && saveState(true);
        const handleObjectRemoved = () => !isStateChanging.current && saveState(true);

        canvas.on("object:added", handleObjectAdded);
        canvas.on("object:modified", handleObjectModified);
        canvas.on("object:removed", handleObjectRemoved);

        canvas.on("object:moving", () => canvas.requestRenderAll());
        canvas.on("object:scaling", () => canvas.requestRenderAll());
        canvas.on("object:rotating", () => canvas.requestRenderAll());

        canvas.on("mouse:down", (opt) => handleMouseDown(opt, canvas));
        canvas.on("mouse:move", (opt) => handleMouseMove(opt, canvas));
        canvas.on("mouse:up", () => handleMouseUp(canvas));

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
            } else if (e.key === "Delete" || e.key === "Backspace") {
                if (!(canvas.getActiveObject() && canvas.getActiveObject().isEditing)) {
                    deleteSelected();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
                e.preventDefault();
                duplicateSelected();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("keydown", handleKeyDown);
            canvas.off("object:added", handleObjectAdded);
            canvas.off("object:modified", handleObjectModified);
            canvas.off("object:removed", handleObjectRemoved);
            canvas.off("object:moving");
            canvas.off("object:scaling");
            canvas.off("object:rotating");
            canvas.dispose();
        };
    }, []);

     // Load initial board data
    useEffect(() => {
        console.log(!fabricCanvas);
        console.log(!initialBoard);
        console.log(hasLoadedInitialBoard.current)
        if (!isCanvasReady || !initialBoard || hasLoadedInitialBoard.current) return;
        console.log(initialBoard);
        isStateChanging.current = true;
        fabricCanvas.current.loadFromJSON(initialBoard, () => {
            fabricCanvas.current.renderAll();
            isStateChanging.current = false;
            hasLoadedInitialBoard.current = true;

            const serialized = JSON.stringify(initialBoard);
            undoStack.current = [serialized];
            setCanUndo(false);
        });
        console.log("data2");
    }, [isCanvasReady, initialBoard]);


     // Save state and emit to server
    const saveState = (immediate = false) => {
        if (!fabricCanvas.current || isStateChanging.current) return;

        const json = fabricCanvas.current.toJSON();
        const serialized = JSON.stringify(json);

        if (undoStack.current[undoStack.current.length - 1] !== serialized) {
            undoStack.current.push(serialized);
            if (undoStack.current.length > 50) undoStack.current.shift();
            redoStack.current = [];
            setCanUndo(undoStack.current.length > 1);
            setCanRedo(false);

            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }

            const emitUpdate = () => {
                console.log("📤 Sending board update:", { objectCount: json?.objects?.length || 0 });
                socket.emit("board:update", { roomId, boardData: json });
            };

            if (immediate) {
                emitUpdate();
            } else {
                saveTimeout.current = setTimeout(emitUpdate, 100);
            }
        }
    };


   
    // Socket.io board updates 
    useEffect(() => {
        if (!fabricCanvas.current) return;

        const handleBoardUpdate = (boardData) => {
            if (!boardData) return;

            console.log("📥 Received board update:", { objectCount: boardData?.objects?.length || 0 });

            // Prevent processing if it's the same state
            const currentState = JSON.stringify(fabricCanvas.current.toJSON());
            const incomingState = JSON.stringify(boardData);

            if (currentState === incomingState) {
                console.log("⏭️ Skipping identical state");
                return;
            }

            isStateChanging.current = true;
            fabricCanvas.current.loadFromJSON(boardData, () => {
                fabricCanvas.current.renderAll();
                isStateChanging.current = false;

                // Update undo stack
                const serialized = JSON.stringify(boardData);
                if (undoStack.current[undoStack.current.length - 1] !== serialized) {
                    undoStack.current.push(serialized);
                    if (undoStack.current.length > 50) undoStack.current.shift();
                }
            });
        };

        socket.on("board:update", handleBoardUpdate);

        return () => {
            socket.off("board:update", handleBoardUpdate);
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        };
    }, []);

   

    // Sync tool modes
    useEffect(() => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;

        canvas.isDrawingMode = activeTool === Tool.PEN || activeTool === Tool.ERASER;
        canvas.selection = activeTool === Tool.SELECT;
        canvas.skipTargetFind = activeTool !== Tool.SELECT;

        if (activeTool !== Tool.SELECT) {
            canvas.discardActiveObject().renderAll();
        }

        if (activeTool === Tool.PEN) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            canvas.freeDrawingBrush.color = strokeColor;
            canvas.freeDrawingBrush.width = strokeWidth;
        } else if (activeTool === Tool.ERASER) {
            if (fabric.EraserBrush) {
                canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
                canvas.freeDrawingBrush.width = strokeWidth * 5;
            } else {
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = hexToRGBA(strokeColor, 0.3);
                canvas.freeDrawingBrush.width = strokeWidth * 5;
            }
        }

        canvas.forEachObject((obj) => {
            obj.selectable = activeTool === Tool.SELECT;
            obj.evented = activeTool === Tool.SELECT;
        });

        canvas.requestRenderAll();
    }, [activeTool, strokeColor, strokeWidth]);

    // Handle color/stroke changes for selection
    useEffect(() => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            isStateChanging.current = true;

            activeObjects.forEach((obj) => {
                obj.set({
                    stroke: strokeColor,
                    strokeWidth,
                    dirty: true
                });
                if (!["line", "i-text"].includes(obj.type)) {
                    obj.set({ fill: fillColor === "transparent" ? "transparent" : fillColor });
                }
                if (obj.type === "i-text") {
                    obj.set({ fill: strokeColor });
                }
                obj.setCoords();
            });

            canvas.requestRenderAll();
            isStateChanging.current = false;
            saveState(true);
        }
    }, [strokeColor, fillColor, strokeWidth]);

    const undo = () => {
        if (undoStack.current.length <= 1) return;
        isStateChanging.current = true;
        const current = undoStack.current.pop();
        if (current) redoStack.current.push(current);
        const previous = undoStack.current[undoStack.current.length - 1];
        fabricCanvas.current.loadFromJSON(JSON.parse(previous), () => {
            fabricCanvas.current.renderAll();
            isStateChanging.current = false;
            setCanUndo(undoStack.current.length > 1);
            setCanRedo(redoStack.current.length > 0);
        });
    };

    const redo = () => {
        if (redoStack.current.length === 0) return;
        isStateChanging.current = true;
        const next = redoStack.current.pop();
        if (next) {
            undoStack.current.push(next);
            fabricCanvas.current.loadFromJSON(JSON.parse(next), () => {
                fabricCanvas.current.renderAll();
                isStateChanging.current = false;
                setCanUndo(undoStack.current.length > 1);
                setCanRedo(redoStack.current.length > 0);
            });
        }
    };

    const handleMouseDown = (opt, canvas) => {
        const tool = activeToolRef.current;
        const shapeTools = [Tool.RECT, Tool.CIRCLE, Tool.LINE, Tool.TEXT];
        if (!shapeTools.includes(tool)) return;

        isMouseDown.current = true;
        const pointer = canvas.getPointer(opt.e);
        startPoint.current = { x: pointer.x, y: pointer.y };

        const props = {
            left: pointer.x,
            top: pointer.y,
            stroke: strokeColorRef.current,
            strokeWidth: strokeWidthRef.current,
            fill: fillColorRef.current === "transparent" ? "transparent" : fillColorRef.current,
            selectable: false,
            evented: false,
            strokeUniform: true,
            objectCaching: false,
        };

        switch (tool) {
            case Tool.RECT:
                currentShape.current = new fabric.Rect({ ...props, width: 0, height: 0 });
                break;
            case Tool.CIRCLE:
                currentShape.current = new fabric.Circle({ ...props, radius: 0 });
                break;
            case Tool.LINE:
                currentShape.current = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], props);
                break;
            case Tool.TEXT: {
                const text = new fabric.IText("Double click to edit", {
                    ...props,
                    fontSize: 24,
                    fill: strokeColorRef.current,
                    selectable: true,
                    evented: true,
                });
                canvas.add(text);
                canvas.setActiveObject(text);
                setActiveTool(Tool.SELECT);
                isMouseDown.current = false;
                return;
            }
        }

        if (currentShape.current) {
            canvas.add(currentShape.current);
            canvas.renderAll();
        }
    };

    const handleMouseMove = (opt, canvas) => {
        if (!isMouseDown.current || !currentShape.current) return;

        const tool = activeToolRef.current;
        const pointer = canvas.getPointer(opt.e);
        const shape = currentShape.current;

        canvas.discardActiveObject();

        switch (tool) {
            case Tool.RECT:
                shape.set({
                    width: Math.abs(pointer.x - startPoint.current.x),
                    height: Math.abs(pointer.y - startPoint.current.y),
                    left: Math.min(pointer.x, startPoint.current.x),
                    top: Math.min(pointer.y, startPoint.current.y),
                    dirty: true,
                });
                break;
            case Tool.CIRCLE: {
                const rx = Math.abs(pointer.x - startPoint.current.x) / 2;
                const ry = Math.abs(pointer.y - startPoint.current.y) / 2;
                const radius = Math.max(rx, ry);
                shape.set({
                    radius,
                    left: Math.min(pointer.x, startPoint.current.x),
                    top: Math.min(pointer.y, startPoint.current.y),
                    dirty: true,
                });
                break;
            }
            case Tool.LINE:
                shape.set({ x2: pointer.x, y2: pointer.y, dirty: true });
                break;
        }

        shape.setCoords();
        canvas.requestRenderAll();
    };

    const handleMouseUp = (canvas) => {
        if (!isMouseDown.current) return;
        isMouseDown.current = false;

        if (currentShape.current) {
            if (
                currentShape.current.width < 1 &&
                currentShape.current.height < 1 &&
                !currentShape.current.radius &&
                currentShape.current.type !== "line"
            ) {
                canvas.remove(currentShape.current);
            } else {
                currentShape.current.set({
                    selectable: true,
                    evented: true,
                    objectCaching: true,
                });
                currentShape.current.setCoords();
            }
            currentShape.current = null;
            canvas.renderAll();
            saveState(true);
        }
    };

    const deleteSelected = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => canvas.remove(obj));
            canvas.requestRenderAll();
            saveState(true);
        }
    };

    const duplicateSelected = () => {
        const canvas = fabricCanvas.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        activeObject.clone((cloned) => {
            canvas.discardActiveObject();
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20,
                evented: true,
            });
            if (cloned.type === "activeSelection") {
                cloned.canvas = canvas;
                cloned.forEachObject((obj) => canvas.add(obj));
                cloned.setCoords();
            } else {
                canvas.add(cloned);
            }
            canvas.setActiveObject(cloned);
            canvas.requestRenderAll();
            saveState(true);
        });
    };

    const groupSelected = () => {
        const canvas = fabricCanvas.current;
        const activeObj = canvas.getActiveObject();
        if (!activeObj || activeObj.type !== "activeSelection") return;
        activeObj.toGroup();
        canvas.requestRenderAll();
        saveState(true);
    };

    const ungroupSelected = () => {
        const canvas = fabricCanvas.current;
        const activeObj = canvas.getActiveObject();
        if (!activeObj || activeObj.type !== "group") return;
        activeObj.toActiveSelection();
        canvas.requestRenderAll();
        saveState(true);
    };

    const tools = [
        { id: Tool.SELECT, icon: MousePointer2, label: "Select" },
        { id: Tool.PEN, icon: Pencil, label: "Pen" },
        { id: Tool.LINE, icon: Minus, label: "Line" },
        { id: Tool.RECT, icon: Square, label: "Rectangle" },
        { id: Tool.CIRCLE, icon: CircleIcon, label: "Circle" },
        { id: Tool.TEXT, icon: Type, label: "Text" },
        { id: Tool.ERASER, icon: Highlighter, label: "Highliter" },
    ];

    useEffect(() => {
        if (!currentUser || !currentUser.userId) return
        if (!permittedMember.includes(currentUser.userId)) {
            setActiveTool(Tool.SELECT);
        }
    },[permittedMember, currentUser])

    return (
        <div className="flex flex-col md:flex-row h-full p-2">
            <div className="flex md:flex-col gap-2 p-5 bg-slate-900 border-r border-slate-800 z-10 overflow-x-auto no-scrollbar">
                {
                    (permittedMember.includes(currentUser.userId) || (currentUser.name) === hostName) &&
                    tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group relative m-5 ${activeTool === tool.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                                }`}
                            style={{ padding: '12px 10px' }}
                            title={tool.label}
                        >
                            <tool.icon size={20} />
                            <span className="hidden lg:block text-xs font-medium px-5">
                                {tool.label}
                            </span>
                        </button>
                    ))
                }

                <div className="h-px bg-slate-800 my-2 hidden md:block px-2" />
                {
                (permittedMember.includes(currentUser.userId) || (currentUser.name) === hostName) &&
                <>
                     <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`p-3 rounded-lg flex items-center justify-center gap-2 ${canUndo
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                        : 'bg-slate-800/50 text-slate-700 cursor-not-allowed'
                        }`}
                    title="Undo"
                >
                    <Undo2 size={20} />
                </button>

                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`p-3 rounded-lg flex items-center justify-center gap-2 ${canRedo
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                        : 'bg-slate-800/50 text-slate-700 cursor-not-allowed'
                        }`}
                    title="Redo"
                >
                    <Redo2 size={20} />
                </button>
                </>
                }
               
            </div>

            <div className="flex-1 relative bg-slate-950 overflow-hidden cursor-crosshair p-2">
                <canvas ref={canvasRef} className="p-2" />

{
    (permittedMember.includes(currentUser.userId) || (currentUser.name) === hostName) &&
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-2xl z-20 max-w-[95vw] overflow-x-auto p-4" style={{ padding: '12px 10px' }}>
                    <div className="flex flex-col gap-1 min-w-fit p-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">
                            Stroke
                        </label>
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(e) => setStrokeColor(e.target.value)}
                            className="w-10 h-6 bg-transparent border-none cursor-pointer rounded p-1"
                        />
                    </div>

                    <div className="flex flex-col gap-1 min-w-fit p-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">
                            Fill
                        </label>
                        <div className="flex items-center gap-2 p-1">
                            <input
                                type="color"
                                value={fillColor === 'transparent' ? '#000000' : fillColor}
                                onChange={(e) => setFillColor(e.target.value)}
                                disabled={fillColor === 'transparent'}
                                className={`w-10 h-6 bg-transparent border-none cursor-pointer rounded p-1 ${fillColor === 'transparent' ? 'opacity-30' : ''
                                    }`}
                            />
                            <button
                                onClick={() =>
                                    setFillColor(fillColor === 'transparent' ? '#3b82f6' : 'transparent')
                                }
                                className={`px-2 py-1 text-[9px] rounded-md font-bold uppercase transition-colors ${fillColor === 'transparent'
                                    ? 'bg-slate-700 text-slate-300'
                                    : 'bg-blue-600 text-white'
                                    }`}
                            >
                                {fillColor === 'transparent' ? 'None' : 'Solid'}
                            </button>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-slate-800 shrink-0 px-1" />

                    <div className="flex flex-col gap-1 min-w-fit p-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-1">
                            Width: {strokeWidth}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                            className="w-20 md:w-24 accent-blue-600 p-1"
                        />
                    </div>

                    <div className="w-px h-8 bg-slate-800 shrink-0 px-1" />

                    <div className="flex items-center gap-1 shrink-0 p-2">
                        <button
                            onClick={duplicateSelected}
                            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100"
                            title="Duplicate"
                        >
                            <Copy size={18} />
                        </button>

                        <button
                            onClick={groupSelected}
                            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100"
                            title="Group Selected"
                        >
                            <Layers size={18} />
                        </button>

                        <button
                            onClick={ungroupSelected}
                            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100"
                            title="Ungroup Selected"
                        >
                            <Ungroup size={18} />
                        </button>

                        <button
                            onClick={deleteSelected}
                            className="p-2 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
}

                <div className="absolute bottom-4 left-4 p-3 bg-slate-900/50 rounded-lg text-slate-500 text-[10px] pointer-events-none select-none">
                    Click & Drag to Draw • Double Click Text to Edit • Use Toolbar for Colors
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;