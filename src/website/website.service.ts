import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SecurityReportService } from 'src/helpers/security-report.service';
import { SerperService } from 'src/helpers/serper.service';
import { WebsiteClassifierService } from 'src/helpers/website-classifier.service';
import { Review, ReviewDocument } from 'src/model/reviews.schema';
import { Website, WebsiteDocument } from 'src/model/website.schema';
import { parseDateString } from 'src/utils/parseDate';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectModel(Website.name)
    private readonly websiteModel: Model<WebsiteDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private securityReportService: SecurityReportService,
    private serperService: SerperService,
    private websiteClassifierService: WebsiteClassifierService,
  ) {}

  private async analyzeWebsiteInitial(url: string): Promise<Website> {
    const websiteDetails =
      await this.websiteClassifierService.analyzeWebsite(url);

    const serperDetails = await this.serperService.searchAllData(url);

    const securityReport =
      await this.securityReportService.generateSecurityReport(
        url,
        serperDetails,
      );

    const newWebsite = new this.websiteModel({
      url: url,
      isScam: securityReport?.isScam,
      riskFactor: securityReport?.riskFactor,
      rating: securityReport?.domainRating,
      summary: securityReport?.summary,
      productOrService: websiteDetails.summary.productOrService,
      businessCategory: websiteDetails.summary.targetAudience,
      targetAudience: websiteDetails.summary.targetAudience,
    });

    const savedWebsite = await newWebsite.save();

    const reviewsToInsert = serperDetails.map((review) => ({
      title: review.title,
      link: review.link,
      date: parseDateString(review.date || ''),
      subject: review.snippet,
      websiteId: new Types.ObjectId(savedWebsite._id as Types.ObjectId),
    }));

    await this.reviewModel.insertMany(reviewsToInsert);

    return savedWebsite;
  }

  async fetchWebsiteData(url: string): Promise<Website> {
    const exists = await this.websiteModel.findOne({ url: url }).exec();

    if (exists) {
      return exists;
    }

    const website = this.analyzeWebsiteInitial(url);

    return website;
  }

  async fetchWebsiteReviews(
    websiteId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
  }> {
    // validate ObjectId
    if (!Types.ObjectId.isValid(websiteId)) {
      throw new BadRequestException('Invalid website id');
    }
    const websiteObjectId = new Types.ObjectId(websiteId);

    // ensure sensible bounds
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    // count total documents
    const total = await this.reviewModel.countDocuments({
      websiteId: websiteObjectId,
    });

    // fetch paginated reviews
    const reviews = await this.reviewModel
      .find({ websiteId: websiteObjectId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(take)
      .exec();

    return {
      reviews,
      total,
      page: Math.max(page, 1),
      limit: take,
    };
  }
}
