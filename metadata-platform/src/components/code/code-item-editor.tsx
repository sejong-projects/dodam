'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CodeItemInput } from '@/lib/validations/code'

interface CodeItemEditorProps {
  value: CodeItemInput[]
  onChange: (items: CodeItemInput[]) => void
}

export function CodeItemEditor({ value, onChange }: CodeItemEditorProps) {
  function addItem() {
    onChange([
      ...value,
      {
        itemCode: '',
        itemName: '',
        itemDescription: '',
        sortOrder: value.length,
        isActive: true,
      },
    ])
  }

  function removeItem(index: number) {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated.map((item, i) => ({ ...item, sortOrder: i })))
  }

  function updateItem(index: number, field: keyof CodeItemInput, fieldValue: string | boolean) {
    const updated = value.map((item, i) =>
      i === index ? { ...item, [field]: fieldValue } : item,
    )
    onChange(updated)
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === value.length - 1) return

    const updated = [...value]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    onChange(updated.map((item, i) => ({ ...item, sortOrder: i })))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">코드 항목</h3>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          항목 추가
        </Button>
      </div>

      {value.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>코드값 *</TableHead>
              <TableHead>코드명 *</TableHead>
              <TableHead>설명</TableHead>
              <TableHead className="w-16">활성</TableHead>
              <TableHead className="w-28">정렬</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {value.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <Input
                    value={item.itemCode}
                    onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                    placeholder="코드값"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    placeholder="코드명"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.itemDescription ?? ''}
                    onChange={(e) => updateItem(index, 'itemDescription', e.target.value)}
                    placeholder="설명"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={item.isActive}
                    onCheckedChange={(checked) => updateItem(index, 'isActive', !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === value.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => removeItem(index)}
                  >
                    ✕
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          코드 항목이 없습니다. &quot;항목 추가&quot; 버튼을 클릭하여 항목을 추가하세요.
        </p>
      )}
    </div>
  )
}
