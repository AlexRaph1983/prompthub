import type { Meta, StoryObj } from '@storybook/react'
import { SearchBar } from '@/components/SearchBar'

const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'enhanced', 'mobile']
    },
    showChips: {
      control: { type: 'boolean' }
    },
    showEmptyState: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
    placeholder: 'Поиск по названию, тегам и жанрам — попробуйте: ambient, k-pop, регги',
    showChips: true,
    showEmptyState: true
  }
}

export const Enhanced: Story = {
  args: {
    variant: 'enhanced',
    placeholder: 'Что ищете? Введите жанр, цель или тег — пример: meditation, upbeat, chill',
    showChips: true,
    showEmptyState: true
  }
}

export const Mobile: Story = {
  args: {
    variant: 'mobile',
    placeholder: 'Поиск...',
    showChips: false,
    showEmptyState: false
  }
}

export const WithoutChips: Story = {
  args: {
    variant: 'default',
    showChips: false,
    showEmptyState: true
  }
}

export const WithoutEmptyState: Story = {
  args: {
    variant: 'default',
    showChips: true,
    showEmptyState: false
  }
}

export const CustomPlaceholder: Story = {
  args: {
    variant: 'enhanced',
    placeholder: 'Найдите идеальный промпт для вашей музыки',
    showChips: true,
    showEmptyState: true
  }
}
