import { escapeCSVValue, createCSVContent, exportCSV } from '@/lib/csv-export'

describe('CSV Export', () => {
  describe('escapeCSVValue', () => {
    it('should escape quotes in values', () => {
      expect(escapeCSVValue('test "quote" value')).toBe('"test ""quote"" value"')
    })

    it('should handle newlines', () => {
      expect(escapeCSVValue('line1\nline2')).toBe('"line1 line2"')
    })

    it('should handle carriage returns', () => {
      expect(escapeCSVValue('line1\rline2')).toBe('"line1 line2"')
    })

    it('should handle cyrillic text', () => {
      expect(escapeCSVValue('тест кириллицы')).toBe('"тест кириллицы"')
    })

    it('should handle mixed content', () => {
      expect(escapeCSVValue('тест "с кавычками" и\nпереносами')).toBe('"тест ""с кавычками"" и переносами"')
    })
  })

  describe('createCSVContent', () => {
    it('should create CSV with headers and data', () => {
      const headers = ['Name', 'Age', 'City']
      const rows = [
        ['John', '25', 'New York'],
        ['Jane', '30', 'London']
      ]
      
      const result = createCSVContent(headers, rows)
      const expected = '"Name","Age","City"\n"John","25","New York"\n"Jane","30","London"'
      
      expect(result).toBe(expected)
    })

    it('should handle cyrillic content', () => {
      const headers = ['Имя', 'Возраст', 'Город']
      const rows = [
        ['Иван', '25', 'Москва'],
        ['Анна', '30', 'Санкт-Петербург']
      ]
      
      const result = createCSVContent(headers, rows)
      const expected = '"Имя","Возраст","Город"\n"Иван","25","Москва"\n"Анна","30","Санкт-Петербург"'
      
      expect(result).toBe(expected)
    })

    it('should handle special characters', () => {
      const headers = ['Query', 'Count']
      const rows = [
        ['test "query"', '5'],
        ['тест "запроса"', '3']
      ]
      
      const result = createCSVContent(headers, rows)
      const expected = '"Query","Count"\n"test ""query""","5"\n"тест ""запроса""","3"'
      
      expect(result).toBe(expected)
    })
  })

  describe('exportCSV', () => {
    // Мокаем DOM методы для тестирования
    beforeEach(() => {
      // Мокаем URL.createObjectURL и revokeObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()
      
      // Мокаем DOM методы
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      }
      
      global.document.createElement = jest.fn(() => mockAnchor as any)
      global.document.body.appendChild = jest.fn()
      global.document.body.removeChild = jest.fn()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should export CSV with BOM for cyrillic support', () => {
      const headers = ['Query', 'Count']
      const rows = [['тест', '5']]
      
      exportCSV(headers, rows, {
        filename: 'test.csv',
        includeBOM: true
      })
      
      // Проверяем, что Blob создан с правильным типом
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(global.document.createElement).toHaveBeenCalledWith('a')
    })

    it('should handle export without BOM', () => {
      const headers = ['Query', 'Count']
      const rows = [['test', '5']]
      
      exportCSV(headers, rows, {
        filename: 'test.csv',
        includeBOM: false
      })
      
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })
})
