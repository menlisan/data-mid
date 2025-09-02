import request from '@/axios'

export interface LineageItem {
  name: string
  type: string
  source_table: string
  source_db_user: string
  source_db_ip: string
  features: string
  dependency: string
}

export const getSqlTextLineage = (sql: string) => {
  return request.post<LineageItem[]>({
    url: import.meta.env.VITE_USE_MOCK === 'true' ? '/mock/sql-get-lineage' : '/sql-get-lineage',
    data: { sql }
  })
}

export const getSqlFileLineage = (file: File) => {
  return request.post<LineageItem[]>({
    url:
      import.meta.env.VITE_USE_MOCK === 'true'
        ? '/mock/sql-file-get-lineage'
        : '/sql-file-get-lineage',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: { file }
  })
}

export const getSqlTableLineage = (table: string) => {
  return request.post<LineageItem[]>({
    url:
      import.meta.env.VITE_USE_MOCK === 'true'
        ? '/mock/sql-table-get-lineage'
        : '/sql-table-get-lineage',
    data: { table }
  })
}

export const getSqlFieldLineage = (field: string) => {
  return request.post<LineageItem[]>({
    url:
      import.meta.env.VITE_USE_MOCK === 'true'
        ? '/mock/sql-field-get-lineage'
        : '/sql-field-get-lineage',
    data: { field }
  })
}
