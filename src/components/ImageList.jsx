import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ImageList({ images, onReorder, onSelectModel, modelMap, defaultModel, imageSize }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="image-list">
        {(provided) => (
          <div
            className="flex flex-col space-y-4 pb-4"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {images.map((img, index) => (
              <Draggable key={img.id} draggableId={img.id} index={index}>
                {(provided) => (
                  <div
                    className="flex-shrink-0"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <div
                      className="flex items-center justify-center overflow-hidden rounded border mb-2"
                      style={{ width: imageSize, height: imageSize }}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="max-w-full max-h-full object-contain bg-gray-100"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                      />
                    </div>
                    <select
                      className="w-full text-sm px-1 py-1 border rounded"
                      value={modelMap[img.id] || defaultModel}
                      onChange={(e) => onSelectModel(img.id, e.target.value)}
                    >
                      <option value="rembg-1.4">rembg-1.4</option>
                      {/* más modelos en el futuro */}
                    </select>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
