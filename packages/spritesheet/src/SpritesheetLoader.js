import { url } from '@pixi/utils';
import { LoaderResource } from '@pixi/loaders';
import { Spritesheet } from './Spritesheet';

/**
 * {@link PIXI.Loader Loader} 中间件，用于加载使用TexturePacker或类似的基于JSON的精灵表创建的纹理图集。
 *
 * 该中间件自动生成纹理资源。
 *
 * @class
 * @memberof PIXI
 * @implements PIXI.ILoaderPlugin
 */
export class SpritesheetLoader
{
    /**
     * 加载资源后调用。
     * @see PIXI.Loader.loaderMiddleware
     * @param {PIXI.LoaderResource} resource
     * @param {function} next
     */
    static use(resource, next)
    {
        const imageResourceName = `${resource.name}_image`;

        // skip if no data, its not json, it isn't spritesheet data, or the image resource already exists
        if (!resource.data
            || resource.type !== LoaderResource.TYPE.JSON
            || !resource.data.frames
            || this.resources[imageResourceName]
        )
        {
            next();

            return;
        }

        const loadOptions = {
            crossOrigin: resource.crossOrigin,
            metadata: resource.metadata.imageMetadata,
            parentResource: resource,
        };

        const resourcePath = SpritesheetLoader.getResourcePath(resource, this.baseUrl);

        // load the image for this sheet
        this.add(imageResourceName, resourcePath, loadOptions, function onImageLoad(res)
        {
            if (res.error)
            {
                next(res.error);

                return;
            }

            const spritesheet = new Spritesheet(
                res.texture.baseTexture,
                resource.data,
                resource.url,
            );

            spritesheet.parse(() =>
            {
                resource.spritesheet = spritesheet;
                resource.textures = spritesheet.textures;
                next();
            });
        });
    }

    /**
     * 获取精灵表根路径
     * @param {PIXI.LoaderResource} resource - 检查路径的资源
     * @param {string} baseUrl - 基础根路径
     */
    static getResourcePath(resource, baseUrl)
    {
        // Prepend url path unless the resource image is a data url
        if (resource.isDataUrl)
        {
            return resource.data.meta.image;
        }

        return url.resolve(resource.url.replace(baseUrl, ''), resource.data.meta.image);
    }
}
