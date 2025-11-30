import { prisma } from '@/lib/prisma';
import type { Locale } from '@/i18n/index';

export interface ArticleListParams {
  limit?: number;
  cursor?: string | null;
  locale?: Locale;
  status?: 'draft' | 'published' | 'archived';
  authorId?: string;
  tagSlug?: string;
}

export interface ArticleWithRelations {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  contentRu: string;
  contentEn: string;
  coverImage: string | null;
  status: string;
  publishedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  articleTags: {
    tag: {
      id: string;
      name: string;
      slug: string;
      color: string | null;
    };
  }[];
}

export interface ArticleListResult {
  items: ArticleWithRelations[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Репозиторий для работы со статьями
 */
export const articleRepository = {
  /**
   * Получить список статей с пагинацией
   */
  async listArticles(params: ArticleListParams = {}): Promise<ArticleListResult> {
    const {
      limit = 20,
      cursor = null,
      status = 'published',
      authorId,
      tagSlug
    } = params;

    const where: any = {
      status
    };

    if (authorId) {
      where.authorId = authorId;
    }

    if (tagSlug) {
      where.articleTags = {
        some: {
          tag: {
            slug: tagSlug
          }
        }
      };
    }

    // Курсорная пагинация
    const cursorCondition = cursor
      ? {
          id: {
            lt: cursor
          }
        }
      : {};

    const items = await prisma.article.findMany({
      where: {
        ...where,
        ...cursorCondition
      },
      take: limit + 1, // +1 для определения наличия следующей страницы
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        articleTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].id
      : null;

    return {
      items: results as ArticleWithRelations[],
      nextCursor,
      hasMore
    };
  },

  /**
   * Получить статью по slug
   */
  async getArticleBySlug(slug: string): Promise<ArticleWithRelations | null> {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            website: true
          }
        },
        articleTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    });

    return article as ArticleWithRelations | null;
  },

  /**
   * Получить связанные статьи по тегам
   */
  async getRelatedArticles(
    articleId: string,
    tagIds: string[],
    limit: number = 3
  ): Promise<ArticleWithRelations[]> {
    if (tagIds.length === 0) {
      return [];
    }

    const articles = await prisma.article.findMany({
      where: {
        id: {
          not: articleId
        },
        status: 'published',
        articleTags: {
          some: {
            tagId: {
              in: tagIds
            }
          }
        }
      },
      take: limit,
      orderBy: {
        publishedAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        articleTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    });

    return articles as ArticleWithRelations[];
  },

  /**
   * Инкрементировать счетчик просмотров статьи
   */
  async incrementViewCount(articleId: string): Promise<void> {
    await prisma.article.update({
      where: { id: articleId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });
  },

  /**
   * Получить последние опубликованные статьи
   */
  async getRecentArticles(limit: number = 5): Promise<ArticleWithRelations[]> {
    const articles = await prisma.article.findMany({
      where: {
        status: 'published'
      },
      take: limit,
      orderBy: {
        publishedAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        articleTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    });

    return articles as ArticleWithRelations[];
  },

  /**
   * Получить статьи для указанных тегов (для перелинковки)
   */
  async getArticlesByTags(tagSlugs: string[], limit: number = 3): Promise<ArticleWithRelations[]> {
    if (tagSlugs.length === 0) {
      return [];
    }

    const articles = await prisma.article.findMany({
      where: {
        status: 'published',
        articleTags: {
          some: {
            tag: {
              slug: {
                in: tagSlugs
              }
            }
          }
        }
      },
      take: limit,
      orderBy: {
        publishedAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        articleTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true
              }
            }
          }
        }
      }
    });

    return articles as ArticleWithRelations[];
  }
};

