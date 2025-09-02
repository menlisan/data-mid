import { SUCCESS_CODE } from '@/constants'

const sample = (data: any[]) => ({ code: SUCCESS_CODE, data })

export default [
  {
    url: '/mock/sql-get-lineage',
    method: 'post',
    response: ({ body }: any) => {
      const sql = body?.sql || ''
      return sample([
        {
          name: 'table1',
          type: 'Table',
          source_table: 'schema1.table1',
          source_db_user: 'db_user1',
          source_db_ip: '192.168.1.100',
          features: 'Primary Key',
          dependency: `From SQL: ${sql}`
        },
        {
          name: 'field1',
          type: 'Field',
          source_table: 'schema1.table1',
          source_db_user: 'db_user1',
          source_db_ip: '192.168.1.100',
          features: 'Indexed',
          dependency: 'Is Depended By table1'
        }
      ])
    }
  },
  {
    url: '/mock/sql-file-get-lineage',
    method: 'post',
    response: () => {
      return sample([
        {
          name: 'table2',
          type: 'Table',
          source_table: 'schema2.table2',
          source_db_user: 'db_user2',
          source_db_ip: '192.168.1.101',
          features: 'Foreign Key',
          dependency: 'Is Depended By field1'
        }
      ])
    }
  },
  {
    url: '/mock/sql-table-get-lineage',
    method: 'post',
    response: ({ body }: any) => {
      const table = body?.table || ''
      return sample([
        {
          name: 'field2',
          type: 'Field',
          source_table: `${table}`,
          source_db_user: 'db_user3',
          source_db_ip: '192.168.1.102',
          features: 'Unique',
          dependency: `Depends On ${table}`
        }
      ])
    }
  },
  {
    url: '/mock/sql-field-get-lineage',
    method: 'post',
    response: ({ body }: any) => {
      const field = body?.field || ''
      return sample([
        {
          name: 'table3',
          type: 'Table',
          source_table: 'schema3.table3',
          source_db_user: 'db_user3',
          source_db_ip: '192.168.1.103',
          features: 'Indexed',
          dependency: `Depends On ${field}`
        }
      ])
    }
  }
]


