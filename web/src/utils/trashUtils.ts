import { useGlobalTrash } from '../contexts/GlobalTrashContext';

export interface DraggableToTrashItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'conversation' | 'dashboard_tab' | 'module' | 'message';
  moduleId: string;
  moduleName: string;
  metadata?: any;
}

export function useTrashDrop() {
  const { trashItem } = useGlobalTrash();

  const handleTrashDrop = async (item: DraggableToTrashItem) => {
    try {
      await trashItem(item);
      return { success: true };
    } catch (error) {
      console.error('Failed to trash item:', error);
      return { success: false, error };
    }
  };

  return { handleTrashDrop };
}

export function makeDraggableToTrash(
  element: HTMLElement,
  item: DraggableToTrashItem,
  onTrashDrop: (item: DraggableToTrashItem) => Promise<{ success: boolean; error?: any }>
) {
  element.setAttribute('draggable', 'true');
  element.setAttribute('data-trash-item', JSON.stringify(item));

  element.addEventListener('dragstart', (e) => {
    e.dataTransfer?.setData('application/json', JSON.stringify(item));
    e.dataTransfer?.setData('text/plain', item.name);
    element.classList.add('dragging-to-trash');
  });

  element.addEventListener('dragend', () => {
    element.classList.remove('dragging-to-trash');
  });

  // Add visual feedback when dragging over trash
  element.addEventListener('dragenter', (e) => {
    e.preventDefault();
    element.classList.add('drag-over-trash');
  });

  element.addEventListener('dragleave', (e) => {
    e.preventDefault();
    element.classList.remove('drag-over-trash');
  });

  element.addEventListener('drop', async (e) => {
    e.preventDefault();
    element.classList.remove('drag-over-trash');
    
    const trashItemData = e.dataTransfer?.getData('application/json');
    if (trashItemData) {
      try {
        const itemData = JSON.parse(trashItemData);
        const result = await onTrashDrop(itemData);
        if (result.success) {
          // Item was successfully trashed, you might want to remove it from the UI
          console.log('Item trashed successfully:', itemData.name);
        } else {
          console.error('Failed to trash item:', result.error);
        }
      } catch (error) {
        console.error('Error processing trash drop:', error);
      }
    }
  });
} 