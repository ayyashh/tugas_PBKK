import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { handlePrismaError } from '../common/prisma-error.handler';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Render('index')
  async findAll() {
    try {
      const posts = await this.postsService.findAll();
      return { title: 'All Posts', posts };
    } catch (error) {
      handlePrismaError(error, 'fetch posts');
    }
  }

  @Get('new')
  @Render('new')
  newPost() {
    return { title: 'Create New Post' };
  }

  @Post()
  async create(@Body() createPostDto: CreatePostDto, @Res() res: Response) {
    try {
      await this.postsService.create(createPostDto);
      res.redirect('/posts');
    } catch (error) {
      handlePrismaError(error, 'create post');
    }
  }

  @Get(':id')
  @Render('show')
  async findOne(@Param('id') id: string) {
    try {
      const post = await this.postsService.findOne(id);
      if (!post) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      return { post };
    } catch (error) {
      handlePrismaError(error, 'fetch post');
    }
  }

  @Get(':id/edit')
  @Render('edit')
  async editPost(@Param('id') id: string) {
    try {
      const post = await this.postsService.findOne(id);
      if (!post) {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      }
      return { title: 'Edit Post', post };
    } catch (error) {
      handlePrismaError(error, 'fetch post');
    }
  }

  @Post(':id/edit')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Res() res: Response,
  ) {
    try {
      await this.postsService.update(id, updatePostDto);
      res.redirect(`/posts/${id}`);
    } catch (error) {
      handlePrismaError(error, 'update post');
    }
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.postsService.remove(id);
      res.redirect('/posts');
    } catch (error) {
      handlePrismaError(error, 'delete post');
    }
  }
}
