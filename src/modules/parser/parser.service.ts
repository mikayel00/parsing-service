import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ParserService {
  constructor(private httpService: HttpService) {}

  async getRequest() {
    const a = await lastValueFrom(
      this.httpService.get(
        'https://market.yandex.ru/product--ladda-ladda-akkumuliatornaia-batareika-750-ma-ch-hr03-aaa-1-2-v-4sht/1777243844/reviews?sku=101853925758&do-waremd5=z4ec7Uj1yqNAzHPxxcdd1w&uniqueId=924574&businessReviews=1',
        {
          withCredentials: true,
          headers: {
            Cookie: 'your-cookie-here',
          },
        },
      ),
    );

    const title = /data-baobab-name="title">([^<]+)<\/h1>/;
    const averageRating =
      /<div class="_3NuXV _66nxG _3WROT Qg8Jj">([\d.]+)<\/div>/;
    const totalReviews =
      /<span class="dcJxu _66nxG _3WROT Qg8Jj">(\d+)\s*оценок<\/span>/;

    const titleMatch = title.exec(a.data);
    const averageRatingMatch = averageRating.exec(a.data);
    const totalReviewsMatch = totalReviews.exec(a.data);

    const reviewMatch =
      /<!--BEGIN \[@MarketNode\/ProductReviewsList\] \/content\/productReviewsList-->([\s\S]*?)<!--END \[@MarketNode\/ProductReviewsList\] \/content\/productReviewsList-->/;

    const reviewData = reviewMatch.exec(a.data);

    const reviews = [];
    const regexPattern =
      /<div itemProp="review" itemscope="" itemType="https:\/\/schema.org\/Review">(.*?)<\/div>/gs;

    let match;

    while ((match = regexPattern.exec(reviewData[1])) !== null) {
      const [, reviewContent] = match;
      const datePublished = this.extractMetaContent(
        reviewContent,
        'datePublished',
      );
      const author = this.extractMetaContent(reviewContent, 'author');
      const description = this.extractMetaContent(reviewContent, 'description');
      const ratingValue = this.extractMetaContent(reviewContent, 'ratingValue');
      const photo = this.extractAvatarUrl(reviewContent);

      reviews.push({ datePublished, author, description, ratingValue, photo });
    }

    return {
      title: titleMatch[1].trim(),
      averageRating: averageRatingMatch[1].trim(),
      totalReviews: totalReviewsMatch[1].trim(),
      reviews,
    };
  }

  private extractMetaContent(reviewContent: string, propName: string): string {
    const regexPattern = new RegExp(
      `<meta itemProp="${propName}" content="([^"]*)"`,
    );
    const match = regexPattern.exec(reviewContent);
    return match ? match[1] : '';
  }

  private extractAvatarUrl(reviewContent: string): string {
    const regexPattern = new RegExp(`<picture class="(.*?)".*?src="(.*?)"`);
    const match = regexPattern.exec(reviewContent);

    return match ? match[2] : '';
  }
}
