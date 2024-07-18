﻿using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Tavenem.Blazor.Framework.Test;

[TestClass]
public class ColorFormatConverterTests
{
    [TestMethod]
    public void CssHex3()
    {
        var result = new ColorFormatConverter("#f00");
        Assert.AreEqual((byte)255, result.Red);
        Assert.AreEqual((byte)0, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)0, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)255, result.AlphaByte);
        Assert.AreEqual(1f, result.AlphaFloat);
        Assert.AreEqual("hsl(0,100%,50%)", result.CssHSL);
        Assert.AreEqual("hsla(0,100%,50%,1)", result.CssHSLA);
        Assert.AreEqual("hsl(0,100%,50%)", result.CssHSLCompact);
        Assert.AreEqual("rgb(255,0,0)", result.CssRGB);
        Assert.AreEqual("rgba(255,0,0,1)", result.CssRGBA);
        Assert.AreEqual("rgb(255,0,0)", result.CssRGBCompact);
        Assert.AreEqual("#ff0000", result.Hex6);
        Assert.AreEqual("#ff0000ff", result.Hex8);
        Assert.AreEqual("#ff0000", result.HexCompact);
        Assert.AreEqual("#ff0000", result.Css);
    }

    [TestMethod]
    public void CssHex6()
    {
        var result = new ColorFormatConverter("#ff0000");
        Assert.AreEqual((byte)255, result.Red);
        Assert.AreEqual((byte)0, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)0, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)255, result.AlphaByte);
        Assert.AreEqual(1f, result.AlphaFloat);
        Assert.AreEqual("hsl(0,100%,50%)", result.CssHSL);
        Assert.AreEqual("hsla(0,100%,50%,1)", result.CssHSLA);
        Assert.AreEqual("hsl(0,100%,50%)", result.CssHSLCompact);
        Assert.AreEqual("rgb(255,0,0)", result.CssRGB);
        Assert.AreEqual("rgba(255,0,0,1)", result.CssRGBA);
        Assert.AreEqual("rgb(255,0,0)", result.CssRGBCompact);
        Assert.AreEqual("#ff0000", result.Hex6);
        Assert.AreEqual("#ff0000ff", result.Hex8);
        Assert.AreEqual("#ff0000", result.HexCompact);
        Assert.AreEqual("#ff0000", result.Css);
    }

    [TestMethod]
    public void CssHex8()
    {
        var result = new ColorFormatConverter("#ff000080");
        Assert.AreEqual((byte)255, result.Red);
        Assert.AreEqual((byte)0, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)0, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)128, result.AlphaByte);
        Assert.IsTrue(Math.Abs(0.5f - result.AlphaFloat) <= 0.01f);
        Assert.IsNull(result.CssHSL);
        Assert.AreEqual("hsla(0,100%,50%,.5)", result.CssHSLA);
        Assert.AreEqual("hsla(0,100%,50%,.5)", result.CssHSLCompact);
        Assert.IsNull(result.CssRGB);
        Assert.AreEqual("rgba(255,0,0,.5)", result.CssRGBA);
        Assert.AreEqual("rgba(255,0,0,.5)", result.CssRGBCompact);
        Assert.IsNull(result.Hex6);
        Assert.AreEqual("#ff000080", result.Hex8);
        Assert.AreEqual("#ff000080", result.HexCompact);
        Assert.AreEqual("rgba(255,0,0,.5)", result.Css);
    }

    [TestMethod]
    public void HSLAByte()
    {
        var result = ColorFormatConverter.FromHSLA(120, 100, 50);
        Assert.AreEqual((byte)0, result.Red);
        Assert.AreEqual((byte)255, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)120, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)255, result.AlphaByte);
        Assert.AreEqual(1f, result.AlphaFloat);
        Assert.AreEqual("hsl(120,100%,50%)", result.CssHSL);
        Assert.AreEqual("hsla(120,100%,50%,1)", result.CssHSLA);
        Assert.AreEqual("hsl(120,100%,50%)", result.CssHSLCompact);
        Assert.AreEqual("rgb(0,255,0)", result.CssRGB);
        Assert.AreEqual("rgba(0,255,0,1)", result.CssRGBA);
        Assert.AreEqual("rgb(0,255,0)", result.CssRGBCompact);
        Assert.AreEqual("#00ff00", result.Hex6);
        Assert.AreEqual("#00ff00ff", result.Hex8);
        Assert.AreEqual("#00ff00", result.HexCompact);
        Assert.AreEqual("#00ff00", result.Css);
    }

    [TestMethod]
    public void HSLAFloat()
    {
        var result = ColorFormatConverter.FromHSLA(120, 100, 50, 0.5f);
        Assert.AreEqual((byte)0, result.Red);
        Assert.AreEqual((byte)255, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)120, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)128, result.AlphaByte);
        Assert.AreEqual(0.5f, result.AlphaFloat);
        Assert.IsNull(result.CssHSL);
        Assert.AreEqual("hsla(120,100%,50%,.5)", result.CssHSLA);
        Assert.AreEqual("hsla(120,100%,50%,.5)", result.CssHSLCompact);
        Assert.IsNull(result.CssRGB);
        Assert.AreEqual("rgba(0,255,0,.5)", result.CssRGBA);
        Assert.AreEqual("rgba(0,255,0,.5)", result.CssRGBCompact);
        Assert.IsNull(result.Hex6);
        Assert.AreEqual("#00ff0080", result.Hex8);
        Assert.AreEqual("#00ff0080", result.HexCompact);
        Assert.AreEqual("rgba(0,255,0,.5)", result.Css);
    }

    [TestMethod]
    public void RGBAByte()
    {
        var result = new ColorFormatConverter(255, 0, 0);
        Assert.AreEqual((byte)255, result.Red);
        Assert.AreEqual((byte)0, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)0, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)255, result.AlphaByte);
        Assert.AreEqual(1f, result.AlphaFloat);
        Assert.AreEqual("hsl(0,100%,50%)", result.CssHSL);
        Assert.AreEqual("hsla(0,100%,50%,1)", result.CssHSLA);
        Assert.AreEqual("hsl(0,100%,50%)", result.CssHSLCompact);
        Assert.AreEqual("rgb(255,0,0)", result.CssRGB);
        Assert.AreEqual("rgba(255,0,0,1)", result.CssRGBA);
        Assert.AreEqual("rgb(255,0,0)", result.CssRGBCompact);
        Assert.AreEqual("#ff0000", result.Hex6);
        Assert.AreEqual("#ff0000ff", result.Hex8);
        Assert.AreEqual("#ff0000", result.HexCompact);
        Assert.AreEqual("#ff0000", result.Css);
    }

    [TestMethod]
    public void RGBAFloat()
    {
        var result = new ColorFormatConverter(255, 0, 0, 0.5f);
        Assert.AreEqual((byte)255, result.Red);
        Assert.AreEqual((byte)0, result.Green);
        Assert.AreEqual((byte)0, result.Blue);
        Assert.AreEqual((byte)0, result.Hue);
        Assert.AreEqual((ushort)100, result.Saturation);
        Assert.AreEqual((byte)50, result.Lightness);
        Assert.AreEqual((byte)128, result.AlphaByte);
        Assert.AreEqual(0.5f, result.AlphaFloat);
        Assert.IsNull(result.CssHSL);
        Assert.AreEqual("hsla(0,100%,50%,.5)", result.CssHSLA);
        Assert.AreEqual("hsla(0,100%,50%,.5)", result.CssHSLCompact);
        Assert.IsNull(result.CssRGB);
        Assert.AreEqual("rgba(255,0,0,.5)", result.CssRGBA);
        Assert.AreEqual("rgba(255,0,0,.5)", result.CssRGBCompact);
        Assert.IsNull(result.Hex6);
        Assert.AreEqual("#ff000080", result.Hex8);
        Assert.AreEqual("#ff000080", result.HexCompact);
        Assert.AreEqual("rgba(255,0,0,.5)", result.Css);
    }
}