import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import styles from './Table.module.css'
import { cn } from '../../../utils/cn'

export interface TableColumn<T = any> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[]
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  rowSelection?: {
    selectedRowKeys: React.Key[]
    onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
  }
  onRow?: (record: T, index: number) => {
    onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void
    onDoubleClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void
    className?: string
  }
  rowKey?: string | ((record: T) => string)
  size?: 'small' | 'middle' | 'large'
  bordered?: boolean
  showHeader?: boolean
  className?: string
  emptyText?: string
  scroll?: { x?: number | string; y?: number | string }
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  rowSelection,
  onRow,
  rowKey = 'id',
  size = 'middle',
  bordered = false,
  showHeader = true,
  className,
  emptyText = 'No data',
  scroll
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return record[rowKey] || index.toString()
  }

  // Handle sorting
  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key: columnKey, direction })
  }

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = sortedData

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(record =>
          String(record[key]).toLowerCase().includes(value.toLowerCase())
        )
      }
    })

    return filtered
  }, [sortedData, searchTerm, filters])

  // Render cell content
  const renderCell = (column: TableColumn<T>, record: T, index: number) => {
    if (column.render) {
      return column.render(record[column.dataIndex as keyof T], record, index)
    }
    return record[column.dataIndex as keyof T]
  }

  // Render sort icon
  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null

    const isActive = sortConfig?.key === column.key
    const direction = sortConfig?.direction

    return (
      <span className={styles.sortIcon}>
        <ChevronUp
          size={12}
          className={cn(
            styles.sortArrow,
            styles.sortArrowUp,
            isActive && direction === 'asc' && styles.sortArrowActive
          )}
        />
        <ChevronDown
          size={12}
          className={cn(
            styles.sortArrow,
            styles.sortArrowDown,
            isActive && direction === 'desc' && styles.sortArrowActive
          )}
        />
      </span>
    )
  }

  if (loading) {
    return (
      <div className={cn(styles.tableContainer, className)}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(styles.tableContainer, className)}>
      {/* Search and filters */}
      <div className={styles.tableToolbar}>
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        {rowSelection && (
          <div className={styles.selectionInfo}>
            {rowSelection.selectedRowKeys.length} selected
          </div>
        )}
      </div>

      {/* Table */}
      <div 
        className={styles.tableWrapper} 
        style={scroll ? { 
          overflowX: scroll.x ? 'auto' : undefined,
          overflowY: scroll.y ? 'auto' : undefined,
          maxWidth: scroll.x,
          maxHeight: scroll.y
        } : undefined}
      >
        <table
          className={cn(
            styles.table,
            styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
            bordered && styles.bordered
          )}
        >
          {showHeader && (
            <thead className={styles.tableHeader}>
              <tr>
                {rowSelection && (
                  <th className={styles.selectionColumn}>
                    <input
                      type="checkbox"
                      checked={
                        filteredData.length > 0 &&
                        rowSelection.selectedRowKeys.length === filteredData.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allKeys = filteredData.map((record, index) => getRowKey(record, index))
                          rowSelection.onChange(allKeys, filteredData)
                        } else {
                          rowSelection.onChange([], [])
                        }
                      }}
                      className={styles.checkbox}
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      styles.tableHeaderCell,
                      column.sortable && styles.sortableHeader,
                      column.align && styles[`align${column.align.charAt(0).toUpperCase() + column.align.slice(1)}`]
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className={styles.headerContent}>
                      <span>{column.title}</span>
                      {renderSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className={styles.tableBody}>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className={styles.emptyCell}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              filteredData.map((record, index) => {
                const key = getRowKey(record, index)
                const rowProps = onRow?.(record, index) || {}
                const isSelected = rowSelection?.selectedRowKeys.includes(key)

                return (
                  <tr
                    key={key}
                    className={cn(
                      styles.tableRow,
                      isSelected && styles.selectedRow,
                      rowProps.className
                    )}
                    onClick={rowProps.onClick}
                    onDoubleClick={rowProps.onDoubleClick}
                  >
                    {rowSelection && (
                      <td className={styles.selectionColumn}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const selectedKeys = [...rowSelection.selectedRowKeys]
                            const selectedRows = filteredData.filter((r, i) =>
                              selectedKeys.includes(getRowKey(r, i))
                            )

                            if (e.target.checked) {
                              selectedKeys.push(key)
                              selectedRows.push(record)
                            } else {
                              const keyIndex = selectedKeys.indexOf(key)
                              if (keyIndex > -1) {
                                selectedKeys.splice(keyIndex, 1)
                                selectedRows.splice(keyIndex, 1)
                              }
                            }

                            rowSelection.onChange(selectedKeys, selectedRows)
                          }}
                          className={styles.checkbox}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          styles.tableCell,
                          column.align && styles[`align${column.align.charAt(0).toUpperCase() + column.align.slice(1)}`]
                        )}
                      >
                        {renderCell(column, record, index)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {Math.min((pagination.current - 1) * pagination.pageSize + 1, pagination.total)} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} entries
          </span>
          <div className={styles.paginationControls}>
            <button
              className={styles.paginationButton}
              disabled={pagination.current === 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Previous
            </button>
            <span className={styles.paginationCurrent}>
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              className={styles.paginationButton}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}