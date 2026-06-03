"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getGroupedRowModel,
    getExpandedRowModel,
    useReactTable,
    GroupingState,
    ExpandedState,
} from "@tanstack/react-table"
import { ChevronRight, ChevronDown } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface PivotTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    initialGrouping?: GroupingState
}

export function PivotTable<TData, TValue>({
    columns,
    data,
    initialGrouping = [],
}: PivotTableProps<TData, TValue>) {
    "use no memo"

    const [grouping, setGrouping] = React.useState<GroupingState>(initialGrouping)
    const [expanded, setExpanded] = React.useState<ExpandedState>({})

    // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table uses interior mutability; this wrapper is opted out with "use no memo".
    const table = useReactTable({
        data,
        columns,
        state: {
            grouping,
            expanded,
        },
        onGroupingChange: setGrouping,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    })

    return (
        <div className="rounded-2xl border border-white/10 bg-background/60 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-primary/5">
            <div className="p-5 bg-gradient-to-r from-muted/30 via-muted/10 to-transparent border-b flex gap-3 flex-wrap items-center">
                <span className="text-sm font-semibold text-muted-foreground mr-2 tracking-wide">Gruplama (Pivot):</span>
                {table.getAllColumns().map(column => {
                    if (!column.getCanGroup()) return null
                    return (
                        <Button
                            key={column.id}
                            variant={column.getIsGrouped() ? "default" : "secondary"}
                            size="sm"
                            onClick={column.getToggleGroupingHandler()}
                            className={`text-xs h-8 px-4 rounded-full transition-all duration-300 shadow-sm ${column.getIsGrouped() ? 'bg-primary/90 hover:bg-primary shadow-primary/20' : 'hover:bg-muted/50'}`}
                        >
                            {column.columnDef.header as string}
                        </Button>
                    )
                })}
            </div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="bg-muted/30">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="h-10 text-xs font-semibold uppercase tracking-wider">
                                    {header.isPlaceholder ? null : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow 
                            key={row.id} 
                            className={`transition-colors duration-200 hover:bg-muted/30 ${row.getIsGrouped() ? "bg-primary/5 font-medium border-l-4 border-l-primary/50" : ""}`}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-3 text-sm">
                                    {cell.getIsGrouped() ? (
                                        <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={row.getToggleExpandedHandler()}>
                                            <div className="p-1 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
                                                {row.getIsExpanded() ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />}
                                            </div>
                                            <span className="font-semibold">{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                                            <span className="text-muted-foreground/60 text-xs ml-2 px-2 py-0.5 rounded-full bg-muted border border-border/50">
                                                {row.subRows.length} kayıt
                                            </span>
                                        </div>
                                    ) : cell.getIsAggregated() ? (
                                        flexRender(
                                            cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                                            cell.getContext()
                                        )
                                    ) : cell.getIsPlaceholder() ? null : (
                                        flexRender(cell.column.columnDef.cell, cell.getContext())
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
