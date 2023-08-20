![Image forwarder](https://user-images.githubusercontent.com/49127376/229620834-6ef5db38-8793-473c-9e4e-52ed6dfc3d3c.png)

<div align="center">
 <a aria-label="Powered by" href="https://image-forwarder.deno.dev/">
  <img src="https://img.shields.io/static/v1?label=Powered%20by&message=Deno&color=blue&logo=deno">
 </a>
 <a aria-label="Github License" href="https://github.com/igorkowalczyk/image-forwarder/blob/main/license.md">
  <img src="https://img.shields.io/github/license/igorkowalczyk/image-forwarder?color=blue&logo=github&label=License">
 </a>
 <a aria-label="Version" href="https://github.com/igorkowalczyk/image-forwarder/releases">
  <img src="https://img.shields.io/github/v/release/igorkowalczyk/image-forwarder?color=blue&logo=github&label=Version">
 </a>
<br/>
 <br/>
  <b>🦕 Deno API that takes the image from a link and transmits the data so that the end user cannot be logged by the origin server</b>
</div>

---

## 🔩 Self Hosting

1. Clone [this repository](https://github.com/igorkowalczyk/image-forwarder) `git clone https://github.com/IgorKowalczyk/image-forwarder`
2. Run `deno task dev` to start the project in development mode or `deno task start` to run the project in production mode.
3. Visit `http://localhost:8080` in your browser

> [!NOTE]
> Deno will automatically install all the project packages on the first run

## 🗜️ API Usage

```http
GET https://image-forwarder.deno.dev/?url=${url}
```

| Parameter | Type     | Description                                |
| :-------- | :------- | :----------------------------------------- |
| `url`     | `string` | URL to the image to forward (**Required**) |

> [!IMPORTANT]
> The url parameter is required and must be a valid url to an image. **Max size of the image is 10MB.**

## ⁉️ Issues

If you come across any errors or have suggestions for improvements, please create a [new issue here](https://github.com/igorkowalczyk/image-forwarder/issues) and describe it clearly.

## 📥 Pull Requests

When submitting a pull request, please follow these steps:

- Clone [this repository](https://github.com/igorkowalczyk/image-forwarder) `https://github.com/IgorKowalczyk/image-forwarder.git`
- Create a branch from `main` and give it a meaningful name (e.g. `my-awesome-new-feature`).
- Open a [pull request](https://github.com/igorkowalczyk/image-forwarder/pulls) on [GitHub](https://github.com/) and clearly describe the feature or fix you are proposing.

## 📋 License

This project is licensed under the MIT. See the [LICENSE](https://github.com/igorkowalczyk/image-forwarder/blob/main/license.md) file for details
