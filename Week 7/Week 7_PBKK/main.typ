#set page(width: 210mm, height: 297mm)
#set text(font: "Linux Libertine Display")

#set page(
  footer: align(right)[#text(size: 12pt, fill: black, "PBKK D")], 
  margin: (top: 40pt, bottom: 40pt)
)

Yahya Ayyash Ashdaqi

5025231210

#line(length: 100%)
#align(center)[
  = [E06] Client-side Rendering 
]

= Backend
```sh
npm install @nestjs/common @nestjs/core class-validator 
npm install prisma @prisma/client
```

== Implement `Controller` and `Service`
=== Controller
- Mengimplementasi method yang bisa dilakukan oleh client pada server
1. GET ID
```js
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }
```
2. POST posts
```js
  @Post()
  async create(@Body() body: { posterName: string; content: string; replyToId?: string }) {
    return this.postsService.create(body);
  }
```
3. PUT ID
```js
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { content: string }) {
    return this.postsService.update(id, body);
  }
```
4. DELETE ID
```js
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.postsService.delete(id);
  }
```
5. findAll
```js
  @Get()
  async findAll(@Query('includeReplies') includeReplies = 'true') {
    const include = includeReplies === 'true';
    return this.postsService.findAll(include);
  }
```

=== Service
- Menangani logika inti aplikasi. Dipanggil oleh controller.
1. FindAll
```js
  async findAll(includeReplies = true): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: includeReplies ? {} : { replyToId: null },
      include: { replies: true },
      orderBy: { createdAt: 'desc' },
    });
  }
```

2. Create new post or reply
```js
  async create(data: { posterName: string; content: string; replyToId?: string }): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }
```

3. Update post
```js
  async update(id: string, data: { content: string }): Promise<Post> {
    return this.prisma.post.update({
      where: { id },
      data,
    });
  }
```

4. Delete post
```js
  async delete(id: string): Promise<Post> {
    return this.prisma.post.delete({
      where: { id },
    });
  }
```

5. FindOne
```js
  async findOne(id: string): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: { replies: true },
    });
  }
```

=== Run Dev
```js
npx generate prisma
npm run start:dev
```

= Frontend
== Install Dependencies
```js
npm install react react-dom
npm install @types/react @types/react-dom
```

== Change Hard-coded values
1. index.tsx
- Mengambil post langsung dari backend NestJS menggunakan `fetch`.
- Menggunakan `<link>` untuk navigasi halaman ke `/post/new`.
- Memanggil API sehingga perubahan tersimpan di database, bukan hanya di state lokal
- Semua interaksi seperti delete atau navigasi menggunakan react state / next.js behavior tanpa reload halaman.
2. new.tsx
- Menambahkan panggilan API menggunakan `fetch` ke endpoint `http://localhost:3000/posts`
- Menggunakan state `loading` untuk menandai proses submit API
3. id.tsx
- Menggunakan fetch API asil untuk mengambil data post berdasarkan `postID` dari backend `http://localhost:3000/posts/${postId}`
- Menambahkan fungsi `handleReply` untuk membuat balasan (reply) ke post secara langsung di backend
- Menggunakan API call DELETE untuk menghapus post atau reply di backend

=== Run Dev
```sh
npm run dev
```

= Perbandingan antara Template Engine vs Client-side Rendering
- Menurut saya client-side rendering lebih sulit dalam pengimplenetasiannya dari pada template engine, selain itu jika tidak memerlukan banyak interaktif yang masif pada web, saya akan lebih memilih ejs.