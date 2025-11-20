import { useState, useEffect } from 'react';
import { useListStore } from '@/lib/store/listStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, CheckSquare, List, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface ListMakerProps {
  slotId: string;
}

export function ListMaker({ slotId }: ListMakerProps) {
  const {
    getListData,
    addItem,
    updateItem,
    removeItem,
    toggleItemCheck,
    toggleItemType,
    clearAllItems,
    loadListData,
  } = useListStore();

  // Load list data on mount
  useEffect(() => {
    loadListData(slotId);
  }, [slotId, loadListData]);

  const listData = getListData(slotId);
  const items = listData.items;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({ text: '', isCheckbox: true });

  const handleAddItem = () => {
    if (formData.text.trim()) {
      addItem(slotId, formData.text.trim(), formData.isCheckbox);
      setFormData({ text: '', isCheckbox: true });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditItem = () => {
    if (editingItem && formData.text.trim()) {
      updateItem(slotId, editingItem, { text: formData.text.trim() });
      setFormData({ text: '', isCheckbox: true });
      setEditingItem(null);
    }
  };

  const startEdit = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setFormData({
        text: item.text,
        isCheckbox: item.isCheckbox,
      });
      setEditingItem(itemId);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-end gap-2">
          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all items from your list. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearAllItems(slotId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              No items yet. Add one to get started!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                {/* Checkbox or Bullet */}
                <div className="flex-shrink-0 pt-0.5">
                  {item.isCheckbox ? (
                    <Checkbox
                      checked={item.isChecked}
                      onCheckedChange={() => toggleItemCheck(slotId, item.id)}
                      className="mt-0.5"
                    />
                  ) : (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    </div>
                  )}
                </div>

                {/* Item Text */}
                <div
                  className={cn(
                    'flex-1 min-w-0 text-sm',
                    item.isCheckbox && item.isChecked && 'line-through text-muted-foreground'
                  )}
                >
                  {item.text}
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(item.id)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleItemType(slotId, item.id)}>
                      {item.isCheckbox ? (
                        <>
                          <List className="h-4 w-4 mr-2" />
                          Switch to Bullet
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Switch to Checkbox
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => removeItem(slotId, item.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
            <DialogDescription>
              Add a new item to your list. You can choose between a checkbox or bullet point.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="item-text" className="text-sm font-medium">
                Item Text
              </label>
              <Input
                id="item-text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter item text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="item-type"
                checked={formData.isCheckbox}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isCheckbox: checked === true })
                }
              />
              <label
                htmlFor="item-type"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use checkbox (unchecked = bullet point)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={!formData.text.trim()}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item text or change its type.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-item-text" className="text-sm font-medium">
                Item Text
              </label>
              <Input
                id="edit-item-text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter item text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditItem();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={!formData.text.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

