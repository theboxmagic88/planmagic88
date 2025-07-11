import { useState } from 'react'
import { Plus, Edit, Trash2, User, Phone, Mail } from 'lucide-react'
import { DataTable } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'
import { useSupabaseQuery, useSupabaseMutation } from '../../hooks/useSupabaseQuery'
import { CustomerForm } from './CustomerForm'
import toast from 'react-hot-toast'

interface Customer {
  id: string
  customer_code: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  status: 'Active' | 'Inactive'
  created_at: string
  updated_at: string
}

export function CustomerList() {
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const { data: customers, isLoading } = useSupabaseQuery<Customer>(
    ['customers'],
    'customers'
  )

  const { delete: deleteCustomer } = useSupabaseMutation<Customer>(
    'customers',
    [['customers']]
  )

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer.mutateAsync(id)
        toast.success('Customer deleted successfully')
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete customer')
      }
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  const columns = [
    {
      key: 'customer_code' as keyof Customer,
      header: 'Customer Code',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'name' as keyof Customer,
      header: 'Customer Name',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
      sortable: true,
    },
    {
      key: 'contact_person' as keyof Customer,
      header: 'Contact Person',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not provided'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'phone' as keyof Customer,
      header: 'Phone',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not provided'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'email' as keyof Customer,
      header: 'Email',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{value || 'Not provided'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status' as keyof Customer,
      header: 'Status',
      render: (value: any) => <StatusBadge status={value} />,
      sortable: true,
    },
    {
      key: 'actions' as keyof Customer,
      header: 'Actions',
      render: (value: any, row: Customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Customer
        </button>
      </div>

      <DataTable
        data={customers || []}
        columns={columns}
        loading={isLoading}
      />

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}