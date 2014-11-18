/// <reference path="../../js/jquery.d.ts" />
/// <reference path="../../js/extensions.d.ts" />
import utils = require("../../utils");
import IProvider = require("./iProvider");
import TreeNode = require("./treeNode");
import Thumb = require("./thumb");

export enum params {
    sequenceIndex,
    canvasIndex,
    zoom,
    rotation
}

// providers contain methods that could be implemented differently according
// to factors like varying back end data provision systems.
// they provide a consistent interface and set of data structures
// for extensions to operate against.
export class BaseProvider implements IProvider{

    canvasIndex: number;
    config: any;
    configExtension: string;
    dataUri: string;
    domain: string;
    embedScriptUri: string;
    embedDomain: string;
    isHomeDomain: boolean;
    isLightbox: boolean;
    isOnlyInstance: boolean;
    isReload: boolean;
    manifest: any;
    rootStructure: any;
    sequence: any;
    sequenceIndex: number;
    treeRoot: TreeNode;

    // map param names to enum indices.
    paramMap: string[] = ['si', 'ci', 'z', 'r'];

    options: any = {
        thumbsUriTemplate: "{0}{1}",
        timestampUris: false,
        mediaUriTemplate: "{0}{1}"
    };

    constructor(config: any, manifest: any) {
        this.config = config;
        this.manifest = manifest;

        // add dataBaseUri to options so it can be overridden.
        this.options.dataBaseUri = utils.Utils.getQuerystringParameter('dbu');

        // get data-attributes that can't be overridden by hash params.
        // other data-attributes are retrieved through app.getParam.
        this.dataUri = utils.Utils.getQuerystringParameter('du');
        this.embedDomain = utils.Utils.getQuerystringParameter('ed');
        this.isHomeDomain = utils.Utils.getQuerystringParameter('hd') === "true";
        this.isOnlyInstance = utils.Utils.getQuerystringParameter('oi') === "true";
        this.embedScriptUri = utils.Utils.getQuerystringParameter('esu');
        this.isReload = utils.Utils.getQuerystringParameter('rl') === "true";
        this.domain = utils.Utils.getQuerystringParameter('d');
        this.isLightbox = utils.Utils.getQuerystringParameter('lb') === "true";

        if (this.isHomeDomain && !this.isReload){
            this.sequenceIndex = parseInt(utils.Utils.getHashParameter(this.paramMap[params.sequenceIndex], parent.document));
        }

        if (!this.sequenceIndex){
            this.sequenceIndex = parseInt(utils.Utils.getQuerystringParameter(this.paramMap[params.sequenceIndex])) || 0;
        }

        this.load();
    }

    load(): void{
        // we know that this sequence exists because the bootstrapper
        // will have loaded it already.
        this.sequence = this.manifest.sequences[this.sequenceIndex];

        // replace all ref sequences with an object that can store
        // its path and sub structures. they won't get used for anything
        // else without a reload.
        for (var i = 0; i < this.manifest.sequences.length; i++) {
            if (!this.manifest.sequences[i].canvases) {
                this.manifest.sequences[i] = {};
            }
        }

        this.parseManifest();

        this.parseStructure();
    }

    reload(callback: any): void {

        var manifestUri = this.dataUri;

        if (this.options.dataBaseUri){
            manifestUri = this.options.dataBaseUri + this.dataUri;
        }

        manifestUri = this.addTimestamp(manifestUri);

        window.manifestCallback = (data: any) => {
            this.manifest = data;

            this.load();

            callback();
        };

        $.ajax({
            url: manifestUri,
            type: 'GET',
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'manifestCallback'
        });
    }

    // todo
    getManifestType(): string{
        return 'monograph';
    }

    getSequenceType(): string{
        // todo: perhaps use viewingHint attribute
        // default to 'seadragon-iiif'
        return 'seadragon-iiif';
    }

    getTitle(): string {
        return this.manifest.label;
    }

    getSeeAlso(): any {
        return this.manifest.seeAlso;
    }

    // todo
    getCanvasOrderLabel(canvas: any): string{
        return null;
    }

    // todo
    getLastCanvasOrderLabel(): string {
        return '-';
    }

    isFirstCanvas(canvasIndex?: number): boolean {
        if (typeof(canvasIndex) === 'undefined') canvasIndex = this.canvasIndex;
        return canvasIndex == 0;
    }

    isLastCanvas(canvasIndex?: number): boolean {
        if (typeof(canvasIndex) === 'undefined') canvasIndex = this.canvasIndex;
        return canvasIndex == this.getTotalCanvases() - 1;
    }

    isSeeAlsoEnabled(): boolean{
        return this.config.options.seeAlsoEnabled !== false;
    }

    getCanvasByIndex(index: number): any {
        return this.sequence.canvases[index];
    }

    getStructureByCanvasIndex(index: number): any {
        if (index == -1) return null;
        var canvas = this.getCanvasByIndex(index);
        return this.getCanvasStructure(canvas);
    }

    getCanvasStructure(canvas: any): any {
        // get the deepest structure that this asset belongs to.
        if (canvas.structures){
            return canvas.structures.last();
        }

        return null;
    }

    getCurrentCanvas(): any {
        return this.sequence.canvases[this.canvasIndex];
    }

    getTotalCanvases(): number{
        return this.sequence.canvases.length;
    }

    isMultiCanvas(): boolean{
        return this.sequence.canvases.length > 1;
    }

    isMultiSequence(): boolean{
        return this.manifest.sequences.length > 1;
    }

    isPaged(): boolean{
        return this.sequence.viewingHint && this.sequence.viewingHint == "paged";
    }

    getMediaUri(mediaUri: string): string{
        var baseUri = this.options.mediaBaseUri || "";
        var template = this.options.mediaUriTemplate;
        var uri = String.prototype.format(template, baseUri, mediaUri);

        return uri;
    }

    setMediaUri(canvas: any): void{
        //canvas.mediaUri = this.getMediaUri(canvas.resources[0].resource['@id'] + '/info.json');
    }

    getPagedIndices(canvasIndex?: number): number[]{
        if (typeof(canvasIndex) === 'undefined') canvasIndex = this.canvasIndex;

        if (this.isFirstCanvas(canvasIndex) || this.isLastCanvas(canvasIndex)){
            return [canvasIndex];
        } else if (canvasIndex % 2){
            return [canvasIndex, canvasIndex + 1];
        } else {
            return [canvasIndex - 1, canvasIndex];
        }
    }

    getFirstPageIndex(): number {
        return 0;
    }

    getLastPageIndex(): number {
        return this.getTotalCanvases() - 1;
    }

    getPrevPageIndex(canvasIndex?: number): number {
        if (typeof(canvasIndex) === 'undefined') canvasIndex = this.canvasIndex;

        var index;

        if (this.isPaged()){
            var indices = this.getPagedIndices(canvasIndex);
            index = indices[0] - 1;
        } else {
            index = canvasIndex - 1;
        }

        return index;
    }

    getNextPageIndex(canvasIndex?: number): number {
        if (typeof(canvasIndex) === 'undefined') canvasIndex = this.canvasIndex;

        var index;

        if (this.isPaged()){
            var indices = this.getPagedIndices(canvasIndex);
            index = indices.last() + 1;
        } else {
            index = canvasIndex + 1;
        }

        if (index > this.getTotalCanvases() - 1) {
            return -1;
        }

        return index;
    }

    getStartCanvasIndex(): number {
        if (this.sequence.startCanvas) {
            // if there's a startCanvas attribute, loop through the canvases and return the matching index.
            for (var i = 0; i < this.sequence.canvases.length; i++) {
                var canvas = this.sequence.canvases[i];

                if (canvas["@id"] == this.sequence.startCanvas) return i;
            }
        }

        // default to first canvas.
        return 0;
    }

    addTimestamp(uri: string): string{
        return uri + "?t=" + utils.Utils.getTimeStamp();
    }

    isDeepLinkingEnabled(): boolean {
        return (this.isHomeDomain && this.isOnlyInstance);
    }

    getThumbUri(canvas: any, width: number, height: number): string {

        var uri;

        if (canvas.resources){
            uri = canvas.resources[0].resource.service['@id'];
        } else if (canvas.images && canvas.images[0].resource.service){
            uri = canvas.images[0].resource.service['@id'];
        } else {
            return "";
        }

        var tile = 'full/' + width + ',' + height + '/0/default.jpg';

        if (uri.endsWith('/')){
            uri += tile;
        } else {
            uri += '/' + tile;
        }

        return uri;
    }

    getThumbs(): Array<Thumb> {
        var thumbs = new Array<Thumb>();

        for (var i = 0; i < this.getTotalCanvases(); i++) {
            var canvas = this.sequence.canvases[i];

            var heightRatio = canvas.height / canvas.width;

            var width = this.config.modules["treeViewLeftPanel"].options.thumbWidth;
            var height = this.config.modules["treeViewLeftPanel"].options.thumbHeight;

            if (heightRatio){
                height = Math.floor(width * heightRatio);
            }

            var uri = this.getThumbUri(canvas, width, height);

            thumbs.push(new Thumb(i, uri, canvas.label, height, true));
        }

        return thumbs;
    }

    parseManifest(): void{

    }

    getRootStructure(): any {
        return this.rootStructure;
    }

    // the purpose of this is to give each canvas in sequence.canvases
    // a collection of structures it belongs to.
    // it also builds a path string property for each structure.
    // this can then be used when a structure is clicked in the tree view
    // where getStructureIndex loops though all canvases and their
    // associated structures until it finds one with a matching path.
    parseStructure(): void{
        // create root structure
        this.rootStructure = {
            path: "",
            structures: []
        };

        if (!this.manifest.structures) return;

        for (var i = 0; i < this.manifest.structures.length; i++) {
            var structure = this.manifest.structures[i];
            this.rootStructure.structures.push(structure);
            structure.path = "/" + i;

            // loop through canvases and associate sequence.canvas with matching @id
            for (var j = 0; j < structure.canvases.length; j++){
                var canvas = this.getCanvasById(structure.canvases[j]);

                if (!canvas){
                    // canvas not found - json invalid.
                    structure.canvases[j] = null;
                    continue;
                }

                if (!canvas.structures) canvas.structures = [];
                canvas.structures.push(structure);
                // create two-way relationship
                structure.canvases[j] = canvas;
            }
        }
    }

    getStructureIndex(path: string): number {
        for (var i = 0; i < this.sequence.canvases.length; i++) {
            var canvas = this.sequence.canvases[i];

            if (!canvas.structures) continue;

            for (var j = 0; j < canvas.structures.length; j++) {
                var structure = canvas.structures[j];

                if (structure.path == path) {
                    return i;
                }
            }
        }

        return null;
    }

    getCanvasById(id: string): any{
        for (var i = 0; i < this.sequence.canvases.length; i++) {
            var c = this.sequence.canvases[i];

            if (c['@id'] === id){
                return c;
            }
        }

        return null;
    }

    getStructureByIndex(structure: any, index: number): any{
        return structure.structures[index];
    }

    // todo
    getCanvasIndexByOrderLabel(label: string): number {
        return null;
    }

    // todo
    getManifestSeeAlsoUri(manifest: any): string{
        return null;
    }

    // todo: currently only supports single-level
    getTree(): TreeNode{
        var rootStructure = this.getRootStructure();

        this.treeRoot = new TreeNode('root');
        this.treeRoot.label = "root";
        this.treeRoot.data = rootStructure;
        this.treeRoot.data.type = "manifest";
        rootStructure.treeNode = this.treeRoot;

        for (var i = 0; i < rootStructure.structures.length; i++){
            var structure = rootStructure.structures[i];

            var node = new TreeNode();
            this.treeRoot.addNode(node);

            node.label = structure.label;
            node.data = structure;
            node.data.type = "structure";
            structure.treeNode = node;
        }

        return this.treeRoot;
    }

    getDomain(): string{
        var parts = utils.Utils.getUrlParts(this.dataUri);
        return parts.host;
    }

    getEmbedDomain(): string{
        return this.embedDomain;
    }

    getMetaData(callback: (data: any) => any): void{
        callback(this.manifest.metadata);
    }

    defaultToThumbsView(): boolean{
        var manifestType = this.getManifestType();

        switch (manifestType){
            case 'monograph':
                if (!this.isMultiSequence()) return true;
                break;
            case 'archive':
                return true;
                break;
            case 'boundmanuscript':
                return true;
                break;
            case 'artwork':
                return true;

        }

        var sequenceType = this.getSequenceType();

        switch (sequenceType){
            case 'application-pdf':
                return true;
                break;
        }

        return false;
    }

    getSettings(): ISettings {
        return this.config.options;
    }

    updateSettings(settings: ISettings): void {
        this.config.options = settings;
    }
}