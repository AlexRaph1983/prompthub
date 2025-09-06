import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RatingStars } from '@/components/RatingStars'

describe('RatingStars', () => {
  it('renders average and count', () => {
    render(<RatingStars value={4.2} count={12} readOnly />)
    expect(screen.getByText('(12)')).toBeInTheDocument()
  })

  it('calls onRate when clicking a star', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<RatingStars value={0} onRate={onRate} />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[3]) // 4th star
    expect(onRate).toHaveBeenCalledWith(4)
  })

  it('does not call onRate when disabled', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    render(<RatingStars value={0} onRate={onRate} disabled />)
    const buttons = screen.getAllByRole('button')
    await user.click(buttons[2])
    expect(onRate).not.toHaveBeenCalled()
  })
})


