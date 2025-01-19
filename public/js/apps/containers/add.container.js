export default class FormContainer extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // activate topic
    this.activateTopicButton();
    // activate post
    this.activatePostButton();

    // activate article
    this.activateArticleButton();
  }

  activateTopicButton = () => {
    // Get the topic button
    const topicButton = this.shadowObj.querySelector('.topic');
    // Add an event listener to the topic button
    topicButton.addEventListener('click', e => {
      e.preventDefault();
      // Get the body element
      const body = document.querySelector('body');
      // Get the content of the topic page
      const content = this.getTopic();

      // insert the content into the body
      body.insertAdjacentHTML('beforeend', content);
    });
  }

  activatePostButton = () => {
    // Get the post button
    const postButton = this.shadowObj.querySelector('.post');
    // Add an event listener to the post button
    postButton.addEventListener('click', e => {
      e.preventDefault();
      // Get the body element
      const body = document.querySelector('body');
      // Get the content
      const content = this.getPost();

      // insert the content into the body
      body.insertAdjacentHTML('beforeend', content);
    });
  }

  activateArticleButton = () => {
    // Get the article button
    const articleButton = this.shadowObj.querySelector('.article');
    // Add an event listener to the article button
    articleButton.addEventListener('click', e => {
      e.preventDefault();

      // Get the body element
      const body = document.querySelector('body');

      // Get the content
      const content = this.getArticle();

      // insert the content into the body
      body.insertAdjacentHTML('beforeend', content);
    });
  }

  getTopic = () => {
    // Show Topic Page Here
    return /* html */`
      <div is="create-topic" api="/t/add" method="PUT"></div>
    `;
  }

  getPost = () => {
    // Show Post Page Here
    return /* html */`
      <div is="create-post" api="/s/add" method="PUT"></div>
    `;
  }

  getArticle = () => {
    // Show Article Page Here
    return /* html */`
      <div is="create-article" api="/s/add" method="PUT"></div>
    `;
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getContent()}
      ${this.getStyles()}
    `;
  }

  getContent = () => {
    return /* html */`
      <p class="title"> What's on your mind?</p>
      <div class="options">
        <a href="/create/article" class="option article">Article</a>
        <a href="/create/post" class="option post">Post</a>
        <a href="/create/topic" class="option topic">Topic</a>
      </div>
    `;
  }

  getStyles() {
    return /* css */`
	    <style>
	      *,
	      *:after,
	      *:before {
	        box-sizing: border-box !important;
	        font-family: inherit;
	        -webkit-box-sizing: border-box !important;
	      }

	      *:focus {
	        outline: inherit !important;
	      }

	      *::-webkit-scrollbar {
	        width: 3px;
	      }

	      *::-webkit-scrollbar-track {
	        background: var(--scroll-bar-background);
	      }

	      *::-webkit-scrollbar-thumb {
	        width: 3px;
	        background: var(--scroll-bar-linear);
	        border-radius: 50px;
	      }

	      h1,
	      h2,
	      h3,
	      h4,
	      h5,
	      h6 {
	        padding: 0;
	        margin: 0;
	        font-family: inherit;
	      }

	      p,
	      ul,
	      ol {
	        padding: 0;
	        margin: 0;
	      }

	      a {
	        text-decoration: none;
	      }

	      :host {
          font-size: 16px;
          background-color: var(--background);
          border-bottom: var(--border);
          padding: 0;
          display: flex;
          flex-flow: column;
          margin: 0;
          gap: 10px;
          padding: 10px 0;
          width: 100%;
        }

        p.title {
          color: var(--title-color);
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          font-size: 1.1rem;
        }

        div.options {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 0 0 5px 0;
          font-size: 1rem;
          font-weight: 400;
          position: relative;
          overflow-x: scroll;
          scrollbar-width: none;
        }

        div.options::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        div.options > a.option {
          border: none;
          color: var(--add-color);
          background: var(--option-background);
          font-family: var(--font-text), sans-serif;
          cursor: pointer;
          text-decoration: none;
          padding: 2px 10px 3px;
          font-weight: 500;
          width: 80px;
          cursor: pointer;
          display: flex;
          flex-flow: row;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 12px;
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
        }

        div.options > a.option.article {
          background: var(--gray-background);
        }

        div.options > a.option.post {
          background: var(--light-linear);
        }

        div.options > a.option.topic {
          background: var(--gray-background);
        }

        div.options > a.option:hover {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

				@media screen and (max-width:660px) {
					:host {
            font-size: 16px;
            gap: 10px;
					}

          div.container {
            display: flex;
            flex-flow: column;
            gap: 10px;
            padding: 5px 0 10px 0;
          }  

          div.options {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            width: 100%;
            overflow-x: scroll;
            scrollbar-width: none;
          }

          div.options::-webkit-scrollbar {
            display: none;
            visibility: hidden;
          }

          div.options > a.option {
            cursor: default !important;
            color: var(--add-color);
            font-family: var(--font-text), sans-serif;
            padding: 3px 10px 4px;
            font-weight: 600;
            width: 80px;
          }
				}
	    </style>
    `;
  }
}